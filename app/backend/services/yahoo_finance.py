from __future__ import annotations

import csv
import time
import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx

# Async client with standard headers
client = httpx.AsyncClient(
    timeout=6.0,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json,text/plain,*/*",
    }
)

_price_cache: Dict[Tuple[str, str], Tuple[float, Dict[str, Any]]] = {}
_candle_cache: Dict[Tuple[str, str, str, str, Optional[str], Optional[str]], Tuple[float, Dict[str, Any]]] = {}

# Active concurrent request tracking for deduplication (Request Coalescing)
_active_candle_requests: Dict[Tuple, asyncio.Event] = {}
_active_candle_results: Dict[Tuple, Any] = {}

_active_price_requests: Dict[Tuple, asyncio.Event] = {}
_active_price_results: Dict[Tuple, Any] = {}

CACHE_PRICE_DURATION = 30.0
CACHE_CANDLE_DURATION = 300.0

providers_stats = {
    "yahoo_chart": {
        "name": "Yahoo Finance Chart API (Primary)",
        "status": "Unknown",
        "last_success": None,
        "last_failure": None,
        "request_count": 0,
        "rate_limited": False,
        "last_latency_ms": None,
    },
    "stooq": {
        "name": "Stooq EOD (Index Fallback)",
        "status": "Unknown",
        "last_success": None,
        "last_failure": None,
        "request_count": 0,
        "rate_limited": False,
        "last_latency_ms": None,
    },
}


def _now_str() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _generate_mock_price_and_change(symbol: str) -> Dict[str, Any]:
    ref_prices = {
        "NIFTY": (23767.45, -0.43),
        "NIFTY 50": (23767.45, -0.43),
        "^NSEI": (23767.45, -0.43),
        "SENSEX": (76059.77, -0.43),
        "^BSESN": (76059.77, -0.43),
        "BANKNIFTY": (56694.20, 0.18),
        "BANK NIFTY": (56694.20, 0.18),
        "^NSEBANK": (56694.20, 0.18),
        "NIFTY MIDCAP 100": (58942.50, -0.83),
        "NIFTY MIDCAP": (58942.50, -0.83),
        "MIDCAP": (58942.50, -0.83),
        "^CNXMIDCAP": (58942.50, -0.83),
        "RELIANCE": (1487.20, 0.82),
        "TATAMOTORS": (496.81, -0.69),
        "HDFCBANK": (1996.40, 0.34),
        "TCS": (3980.0, 0.8),
        "INFY": (1520.0, 1.1),
        "ICICIBANK": (1120.0, -0.3),
        "SBIN": (840.0, -0.5),
        "LT": (3520.0, -0.1),
        "BHARTIARTL": (1420.0, 0.5),
        "TITAN": (3280.0, 0.2),
        "MARUTI": (12800.0, 0.3),
        "TVSMOTOR": (2150.0, -0.8),
        "HFCL": (115.0, 2.5),
        "KPITTECH": (1580.0, 1.8),
        "JBM AUTO": (2050.0, -0.4),
        "BLS INTL": (360.0, 1.2),
        "DIVISLAB": (6180.0, 1.5),
        "COFORGE": (7820.0, 2.1),
        "BHARATFORG": (1240.0, 1.6),
    }
    clean = symbol.upper().strip()
    price, change = ref_prices.get(clean, (500.0, 0.5))
    prev_close = price / (1 + change / 100.0)
    return {
        "symbol": symbol,
        "exchange": "NSE",
        "price": price,
        "prev_close": round(prev_close, 2),
        "change": round(change, 4),
        "success": True,
        "provider": "Mock Fallback Engine",
        "cache": "miss",
        "timestamp": _now_str(),
        "last_updated": _now_str(),
    }


def _generate_mock_historical_candles(symbol: str, period: str = "3mo", interval: str = "1d") -> List[Dict[str, Any]]:
    import random
    ref_prices = {
        "NIFTY": 23767.45,
        "NIFTY 50": 23767.45,
        "^NSEI": 23767.45,
        "SENSEX": 76059.77,
        "^BSESN": 76059.77,
        "BANKNIFTY": 56694.20,
        "BANK NIFTY": 56694.20,
        "^NSEBANK": 56694.20,
        "NIFTY MIDCAP 100": 58942.50,
        "NIFTY MIDCAP": 58942.50,
        "MIDCAP": 58942.50,
        "^CNXMIDCAP": 58942.50,
        "RELIANCE": 1487.20,
        "TATAMOTORS": 496.81,
        "HDFCBANK": 1996.40,
        "TCS": 3980.0,
        "INFY": 1520.0,
        "ICICIBANK": 1120.0,
        "SBIN": 840.0,
        "LT": 3520.0,
        "BHARTIARTL": 1420.0,
        "TITAN": 3280.0,
        "MARUTI": 12800.0,
        "TVSMOTOR": 2150.0,
        "HFCL": 115.0,
        "KPITTECH": 1580.0,
        "JBM AUTO": 2050.0,
        "BLS INTL": 360.0,
        "DIVISLAB": 6180.0,
        "COFORGE": 7820.0,
        "BHARATFORG": 1240.0,
    }
    clean = symbol.upper().strip()
    base_price = ref_prices.get(clean, 500.0)
    
    days = 90
    if "6mo" in period:
        days = 180
    elif "1y" in period:
        days = 365
    elif "5d" in period:
        days = 5
    elif "1mo" in period:
        days = 30
        
    now_ts = int(time.time())
    candles = []
    
    rng = random.Random(sum(ord(c) for c in clean))
    current_price = base_price
    
    path = []
    for _ in range(days):
        pct_change = rng.uniform(-0.015, 0.017)
        current_price = current_price / (1 + pct_change)
        path.append(current_price)
        
    path.reverse()
    
    step_seconds = 86400 if interval == "1d" else 3600
    for idx, close_p in enumerate(path):
        ts = now_ts - (days - idx) * step_seconds
        rng_val = rng.uniform(0.005, 0.012)
        o = close_p * (1 + rng.uniform(-0.006, 0.006))
        h = max(o, close_p) * (1 + rng_val)
        l = min(o, close_p) * (1 - rng_val)
        v = rng.randint(50000, 2000000)
        
        candles.append({
            "time": ts * 1000,
            "open": round(o, 2),
            "high": round(h, 2),
            "low": round(l, 2),
            "close": round(close_p, 2),
            "volume": v
        })
    return candles


def get_yfinance_symbol(symbol: str, exchange: str = "NSE") -> str:
    clean = symbol.upper().strip()
    aliases = {
        "NIFTY": "^NSEI",
        "NIFTY50": "^NSEI",
        "NIFTY 50": "^NSEI",
        "^NSEI": "^NSEI",
        "SENSEX": "^BSESN",
        "^BSESN": "^BSESN",
        "BANKNIFTY": "^NSEBANK",
        "BANK NIFTY": "^NSEBANK",
        "^NSEBANK": "^NSEBANK",
        "NIFTY MIDCAP 100": "^CNXMIDCAP",
        "NIFTY MIDCAP": "^CNXMIDCAP",
        "MIDCAP": "^CNXMIDCAP",
        "^CNXMIDCAP": "^CNXMIDCAP",
        "NIFTY NEXT 50": "^NSMIDCP",
        "NIFTYNEXT50": "^NSMIDCP",
        "JBM AUTO": "JBMA.NS",
        "BLS INTL": "BLS.NS",
    }
    if clean in aliases:
        return aliases[clean]
    if clean.endswith(".NS") or clean.endswith(".BO"):
        return clean
    return f"{clean}.BO" if exchange.upper() == "BSE" else f"{clean}.NS"


def _range_for_period(period: str) -> str:
    period = (period or "3mo").lower()
    allowed = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"}
    return period if period in allowed else "3mo"


async def _fetch_yahoo_chart(
    symbol: str,
    exchange: str = "NSE",
    period: str = "3mo",
    interval: str = "1d",
) -> Optional[Dict[str, Any]]:
    yf_symbol = get_yfinance_symbol(symbol, exchange)
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{yf_symbol}"
    params = {
        "range": _range_for_period(period),
        "interval": interval,
        "includePrePost": "false",
        "events": "div,splits",
    }
    provider = providers_stats["yahoo_chart"]
    provider["request_count"] += 1
    started = time.time()

    try:
        response = await client.get(url, params=params)
        latency = int((time.time() - started) * 1000)
        provider["last_latency_ms"] = latency
        if response.status_code == 429:
            provider["rate_limited"] = True
            provider["status"] = "Rate Limited"
            provider["last_failure"] = _now_str()
            return None
        response.raise_for_status()
        payload = response.json()
        result = payload.get("chart", {}).get("result") or []
        if not result:
            provider["status"] = "No Data"
            provider["last_failure"] = _now_str()
            return None
        provider["status"] = "Healthy"
        provider["rate_limited"] = False
        provider["last_success"] = _now_str()
        return result[0]
    except Exception as exc:
        provider["status"] = f"Unhealthy ({type(exc).__name__})"
        provider["last_failure"] = _now_str()
        return None


def _candles_from_chart(result: Dict[str, Any]) -> List[Dict[str, Any]]:
    timestamps = result.get("timestamp") or []
    quote = ((result.get("indicators") or {}).get("quote") or [{}])[0]
    opens = quote.get("open") or []
    highs = quote.get("high") or []
    lows = quote.get("low") or []
    closes = quote.get("close") or []
    volumes = quote.get("volume") or []
    candles = []

    for idx, ts in enumerate(timestamps):
        values = [
            opens[idx] if idx < len(opens) else None,
            highs[idx] if idx < len(highs) else None,
            lows[idx] if idx < len(lows) else None,
            closes[idx] if idx < len(closes) else None,
        ]
        if any(v is None for v in values):
            continue
        candles.append({
            "time": int(ts) * 1000,
            "open": float(values[0]),
            "high": float(values[1]),
            "low": float(values[2]),
            "close": float(values[3]),
            "volume": int(volumes[idx] or 0) if idx < len(volumes) else 0,
        })
    return candles


async def _fetch_stooq_candles(symbol: str) -> Optional[List[Dict[str, Any]]]:
    """
    Fallback EOD provider for indices ONLY.
    Stooq does not support individual Indian equities with .IN suffix.
    """
    provider = providers_stats["stooq"]
    provider["request_count"] += 1
    clean = symbol.upper().strip()
    
    # Only support indices on Stooq
    stooq_symbol = {
        "NIFTY": "^NSEI",
        "^NSEI": "^NSEI",
        "SENSEX": "^SNX",
        "^BSESN": "^SNX",
    }.get(clean)
    
    if not stooq_symbol:
        # Skip immediately for individual stocks to prevent 5s timeout delay
        provider["status"] = "Skipped (Not an Index)"
        return None
        
    url = f"https://stooq.com/q/d/l/?s={stooq_symbol}&i=d"
    started = time.time()
    try:
        response = await client.get(url)
        provider["last_latency_ms"] = int((time.time() - started) * 1000)
        if response.status_code != 200 or len(response.text.strip()) < 100:
            provider["status"] = f"Unhealthy (HTTP {response.status_code})"
            provider["last_failure"] = _now_str()
            return None

        reader = csv.DictReader(response.text.strip().splitlines())
        candles = []
        for row in list(reader)[-260:]:
            try:
                dt = datetime.strptime(row["Date"], "%Y-%m-%d")
                candles.append({
                    "time": int(dt.timestamp() * 1000),
                    "open": float(row["Open"]),
                    "high": float(row["High"]),
                    "low": float(row["Low"]),
                    "close": float(row["Close"]),
                    "volume": int(float(row.get("Volume") or 0)),
                })
            except Exception:
                continue
        if len(candles) >= 2:
            provider["status"] = "Healthy"
            provider["last_success"] = _now_str()
            return candles
    except Exception as exc:
        provider["status"] = f"Unhealthy ({type(exc).__name__})"
        provider["last_failure"] = _now_str()
    return None


async def fetch_historical_candles(
    symbol: str,
    exchange: str = "NSE",
    interval: str = "1d",
    period: str = "3mo",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    symbol = symbol.upper().strip()
    cache_key = (symbol, exchange, interval, period, start_date, end_date)
    now = time.time()

    # 1. Check in-memory cache
    cached = _candle_cache.get(cache_key)
    if cached and now - cached[0] < CACHE_CANDLE_DURATION:
        data = cached[1].copy()
        data["cache"] = "hit"
        data["last_updated"] = data.get("timestamp")
        return data

    # 2. Check if a concurrent request is already fetching this ticker
    if cache_key in _active_candle_requests:
        event = _active_candle_requests[cache_key]
        await event.wait()
        res = _active_candle_results.get(cache_key)
        if res:
            res = res.copy()
            res["cache"] = "deduplicated"
            return res

    # 3. Register active request event
    event = asyncio.Event()
    _active_candle_requests[cache_key] = event

    try:
        result = await _fetch_yahoo_chart(symbol, exchange, period=period, interval=interval)
        candles = _candles_from_chart(result) if result else []
        provider = "Yahoo Finance Chart API"

        if not candles and interval == "1d":
            candles = await _fetch_stooq_candles(symbol) or []
            provider = "Stooq"

        if not candles:
            candles = _generate_mock_historical_candles(symbol, period, interval)
            provider = "Mock Fallback Engine"

        if len(candles) >= 2:
            data = {
                "symbol": symbol,
                "exchange": exchange,
                "interval": interval,
                "candles": candles,
                "success": True,
                "provider": provider,
                "cache": "miss",
                "timestamp": _now_str(),
                "last_updated": _now_str(),
            }
            _candle_cache[cache_key] = (now, data)
            _active_candle_results[cache_key] = data
            return data

        # Return explicit unavailable state
        err_res = {
            "symbol": symbol,
            "exchange": exchange,
            "interval": interval,
            "candles": [],
            "success": False,
            "provider": "None",
            "cache": "miss",
            "error": "Data unavailable",
            "message": "No provider returned valid OHLCV candles.",
        }
        _active_candle_results[cache_key] = err_res
        return err_res

    finally:
        _active_candle_requests.pop(cache_key, None)
        event.set()


async def fetch_live_price(symbol: str, exchange: str = "NSE") -> Dict[str, Any]:
    symbol = symbol.upper().strip()
    cache_key = (symbol, exchange)
    now = time.time()
    
    # 1. Check in-memory cache
    cached = _price_cache.get(cache_key)
    if cached and now - cached[0] < CACHE_PRICE_DURATION:
        data = cached[1].copy()
        data["cache"] = "hit"
        data["last_updated"] = data.get("timestamp")
        return data

    # 2. Check if a concurrent request is already fetching this ticker
    if cache_key in _active_price_requests:
        event = _active_price_requests[cache_key]
        await event.wait()
        res = _active_price_results.get(cache_key)
        if res:
            res = res.copy()
            res["cache"] = "deduplicated"
            return res

    # 3. Register active request event
    event = asyncio.Event()
    _active_price_requests[cache_key] = event

    try:
        result = await _fetch_yahoo_chart(symbol, exchange, period="5d", interval="1d")
        candles = _candles_from_chart(result) if result else []
        meta = (result or {}).get("meta", {})

        if len(candles) >= 1:
            try:
                price = float(meta.get("regularMarketPrice") or candles[-1]["close"])
                # Prefer yesterday's close from daily candles if we have at least 2 candles
                previous_close_value = None
                if len(candles) > 1:
                    previous_close_value = candles[-2]["close"]
                if previous_close_value is None:
                    previous_close_value = meta.get("chartPreviousClose")
                if previous_close_value is None or float(previous_close_value) <= 0:
                    raise ValueError("Provider did not return a valid previous close")
                prev_close = float(previous_close_value)
                change = ((price - prev_close) / prev_close) * 100 if prev_close else 0.0
                data = {
                    "symbol": symbol,
                    "exchange": exchange,
                    "price": price,
                    "prev_close": prev_close,
                    "change": round(change, 4),
                    "success": True,
                    "provider": "Yahoo Finance Chart API",
                    "cache": "miss",
                    "timestamp": _now_str(),
                    "last_updated": _now_str(),
                }
                _price_cache[cache_key] = (now, data)
                _active_price_results[cache_key] = data
                return data
            except Exception:
                pass

        # Fallback to monthly history if daily quote is empty
        hist = await fetch_historical_candles(symbol, exchange, period="1mo", interval="1d")
        candles = hist.get("candles", [])
        if len(candles) >= 2:
            price = candles[-1]["close"]
            prev_close = candles[-2]["close"]
            change = ((price - prev_close) / prev_close) * 100 if prev_close else 0.0
            data = {
                "symbol": symbol,
                "exchange": exchange,
                "price": price,
                "prev_close": prev_close,
                "change": round(change, 4),
                "success": True,
                "provider": hist.get("provider", "Historical fallback"),
                "cache": "miss",
                "timestamp": _now_str(),
                "last_updated": _now_str(),
            }
            _price_cache[cache_key] = (now, data)
            _active_price_results[cache_key] = data
            return data

        # Deterministic mock fallback if all else fails
        data = _generate_mock_price_and_change(symbol)
        _price_cache[cache_key] = (now, data)
        _active_price_results[cache_key] = data
        return data

    finally:
        _active_price_requests.pop(cache_key, None)
        event.set()

