import os
import shutil
import json
import asyncio
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn

from services.yahoo_finance import fetch_live_price, fetch_historical_candles, providers_stats
from services.nubra_client import NubraClient
from services.ai_rag import StalkRAG
from services.scoring import calculate_technical_indicators_and_score
from services.strategy_engine import build_trade_plan, is_market_open_now, run_breakout_backtest
from services.openui_generator import (
    generate_openui_with_llm,
    build_single_stock_analysis_ui,
    build_rsi_visualization_ui,
    build_indicator_chart_ui,
    build_stock_comparison_ui,
    build_trade_review_ui,
    build_opportunity_list_ui,
    build_portfolio_ui
)

app = FastAPI(title="Stalk Market API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services singletons
nubra_client = NubraClient(use_uat=True)
rag = StalkRAG()

KNOWN_NUBRA_REF_IDS = {
    "HFCL": 1755599,
    "KPITTECH": 1755600,
    "JBM AUTO": 1755601,
    "BLS INTL": 1755602,
    "TVSMOTOR": 83414,
    "RELIANCE": 1842210,
    "DIVISLAB": 1755603,
    "COFORGE": 1755604,
    "BHARATFORG": 1755605,
}

LIQUID_SWING_UNIVERSE = [
    {"symbol": "TATAMOTORS", "name": "Tata Motors Ltd.", "sector": "Auto"},
    {"symbol": "RELIANCE", "name": "Reliance Industries", "sector": "Energy"},
    {"symbol": "TCS", "name": "Tata Consultancy Services", "sector": "IT"},
    {"symbol": "INFY", "name": "Infosys", "sector": "IT"},
    {"symbol": "HDFCBANK", "name": "HDFC Bank", "sector": "Banking"},
    {"symbol": "ICICIBANK", "name": "ICICI Bank", "sector": "Banking"},
    {"symbol": "SBIN", "name": "State Bank of India", "sector": "Banking"},
    {"symbol": "LT", "name": "Larsen & Toubro", "sector": "Capital Goods"},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel", "sector": "Telecom"},
    {"symbol": "TITAN", "name": "Titan Company", "sector": "Consumer"},
    {"symbol": "MARUTI", "name": "Maruti Suzuki", "sector": "Auto"},
    {"symbol": "TVSMOTOR", "name": "TVS Motor", "sector": "Auto"},
    {"symbol": "HFCL", "name": "HFCL Ltd.", "sector": "Telecom"},
    {"symbol": "KPITTECH", "name": "KPIT Technologies", "sector": "IT Services"},
    {"symbol": "DIVISLAB", "name": "Divi's Laboratories", "sector": "Healthcare"},
    {"symbol": "COFORGE", "name": "Coforge Ltd.", "sector": "IT Services"},
    {"symbol": "BHARATFORG", "name": "Bharat Forge Ltd.", "sector": "Capital Goods"},
]

def resolve_multiple_symbols(text: str) -> List[str]:
    text_lower = text.lower()
    mapping = [
        ("tata motors passenger", "TMPV"),
        ("tata motors", "TATAMOTORS"),
        ("tata motor", "TATAMOTORS"),
        ("tmcv", "TATAMOTORS"),
        ("reliance industries", "RELIANCE"),
        ("reliance", "RELIANCE"),
        ("hdfc bank", "HDFCBANK"),
        ("hdfc", "HDFCBANK"),
        ("icici bank", "ICICIBANK"),
        ("icici", "ICICIBANK"),
        ("infosys", "INFY"),
        ("infy", "INFY"),
        ("bharti airtel", "BHARTIARTL"),
        ("airtel", "BHARTIARTL"),
        ("tvs motor", "TVSMOTOR"),
        ("tvs", "TVSMOTOR"),
        ("tata consultancy", "TCS"),
        ("tcs", "TCS"),
        ("state bank of india", "SBIN"),
        ("state bank", "SBIN"),
        ("sbi", "SBIN"),
        ("l&t", "LT"),
        ("larsen & toubro", "LT"),
        ("larsen", "LT"),
        ("titan company", "TITAN"),
        ("titan", "TITAN"),
        ("maruti suzuki", "MARUTI"),
        ("maruti", "MARUTI"),
        ("hfcl", "HFCL"),
        ("kpittech", "KPITTECH"),
        ("kpit", "KPITTECH"),
        ("jbm auto", "JBM AUTO"),
        ("jbm", "JBM AUTO"),
        ("bls intl", "BLS INTL"),
        ("bls international", "BLS INTL"),
        ("bls", "BLS INTL"),
        ("divis lab", "DIVISLAB"),
        ("divis", "DIVISLAB"),
        ("coforge", "COFORGE"),
        ("bharat forge", "BHARATFORG"),
        ("bharatforge", "BHARATFORG"),
    ]
    
    found = []
    for phrase, symbol in mapping:
        if phrase in text_lower:
            if symbol not in found:
                found.append(symbol)
            text_lower = text_lower.replace(phrase, "")
            
    words = [w.strip("?,.()[]\"'") for w in text.split()]
    known_universe = [x["symbol"] for x in LIQUID_SWING_UNIVERSE] + ["HFCL", "KPITTECH", "JBM AUTO", "BLS INTL", "RELIANCE", "TVSMOTOR", "KPIT"]
    for w in words:
        w_up = w.upper()
        if w_up in known_universe:
            if w_up not in found:
                found.append(w_up)
        elif w_up.endswith(".NS") and w_up[:-3] in known_universe:
            if w_up[:-3] not in found:
                found.append(w_up[:-3])
                
    for idx, sym in enumerate(found):
        if sym == "KPIT":
            found[idx] = "KPITTECH"
            
    return found

def resolve_single_symbol(text: str) -> Optional[str]:
    symbols = resolve_multiple_symbols(text)
    return symbols[0] if symbols else None


market_data_health = {
    "status": "healthy",
    "last_check": None,
    "error": None,
    "consecutive_failures": 0
}

async def market_data_health_check_loop():
    from datetime import datetime
    print("INFO: Starting market data health check background task loop...")
    while True:
        try:
            res = await fetch_live_price("RELIANCE")
            provider_info = providers_stats.get("yahoo_chart", {})
            if res.get("success", False):
                market_data_health["status"] = "healthy"
                market_data_health["error"] = None
                market_data_health["consecutive_failures"] = 0
            else:
                market_data_health["consecutive_failures"] += 1
                if provider_info.get("rate_limited", False):
                    market_data_health["status"] = "rate_limited"
                    market_data_health["error"] = "Primary market data provider is rate limited."
                else:
                    market_data_health["status"] = "unhealthy"
                    market_data_health["error"] = f"No valid quote. Provider: {res.get('provider', 'None')}"
        except Exception as e:
            market_data_health["consecutive_failures"] += 1
            market_data_health["status"] = "unhealthy"
            market_data_health["error"] = str(e)
        
        market_data_health["last_check"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        await asyncio.sleep(300) # Check every 5 minutes

def get_market_session_details():
    from datetime import timezone, datetime, timedelta, time as dtime
    
    # Get current time in IST
    utc_now = datetime.now(timezone.utc)
    ist_now = utc_now.astimezone(timezone(timedelta(hours=5, minutes=30)))
    
    weekday = ist_now.weekday() # 0 = Monday, 6 = Sunday
    ist_time = ist_now.time()
    
    market_open_time = dtime(9, 15)
    market_close_time = dtime(15, 30)
    
    is_weekday = weekday < 5 # Mon-Fri
    is_within_hours = market_open_time <= ist_time <= market_close_time
    
    is_open = is_weekday and is_within_hours
    
    # Current Session Name
    if not is_weekday:
        current_session = "Weekend"
    elif ist_time < market_open_time:
        current_session = "Pre-Market"
    elif ist_time <= market_close_time:
        current_session = "Normal Trading"
    else:
        current_session = "Post-Market"
        
    # Calculate Next Market Open
    next_open = ist_now
    if weekday == 5: # Saturday
        next_open = ist_now + timedelta(days=2)
    elif weekday == 6: # Sunday
        next_open = ist_now + timedelta(days=1)
    elif weekday < 5: # Monday-Friday
        if ist_time >= market_close_time:
            if weekday == 4: # Friday
                next_open = ist_now + timedelta(days=3)
            else:
                next_open = ist_now + timedelta(days=1)
            
    next_open_dt = datetime(
        year=next_open.year,
        month=next_open.month,
        day=next_open.day,
        hour=9,
        minute=15,
        second=0,
        microsecond=0,
        tzinfo=timezone(timedelta(hours=5, minutes=30))
    )
    
    next_open_str = next_open_dt.strftime("%A, %b %d, %H:%M IST")
    last_updated_str = ist_now.strftime("%Y-%m-%d %H:%M:%S IST")
    
    return {
        "is_open": is_open,
        "session": current_session,
        "next_open": next_open_str,
        "last_updated": last_updated_str
    }

async def check_session_validity_background():
    print("INFO: Checking saved Nubra session token validity in the background...")
    try:
        valid = await nubra_client.check_session_validity()
        if valid:
            print("INFO: Persisted Nubra session token is VALID. API connected.")
        else:
            print("WARNING: Persisted Nubra session token is INVALID or EXPIRED.")
    except Exception as e:
        print(f"ERROR: Background session validity check failed: {e}")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(market_data_health_check_loop())
    
    # Check session validity
    if nubra_client.session_token:
        # Run in background to avoid blocking ASGI server boot
        asyncio.create_task(check_session_validity_background())


# Storage directory for uploaded playbooks
UPLOAD_DIR = "uploaded_playbooks"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- REQUEST MODELS ---
class OTPRequest(BaseModel):
    phone: str
    skip_totp: bool = False
    temp_token: Optional[str] = None

class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str
    temp_token: str

class MPINVerifyRequest(BaseModel):
    pin: str
    auth_token: str

class SaveCredentialsRequest(BaseModel):
    phone: str
    mpin: str
    device_id: Optional[str] = None


class OrderRequest(BaseModel):
    ref_id: int
    qty: int
    side: str
    price: float = 0.0
    price_type: str = "MARKET"
    symbol: str

class MarginRequest(BaseModel):
    ref_id: int
    qty: int
    side: str
    price: float = 0.0

class BacktestRequest(BaseModel):
    symbols: List[str] = ["RELIANCE", "TVSMOTOR", "HFCL", "KPITTECH"]
    period: str = "1y"
    initial_capital: float = 100000.0
    risk_per_trade_pct: float = 0.5
    max_position_pct: float = 10.0
    holding_days: int = 8

class AutomationRequest(BaseModel):
    dry_run: bool = True
    allow_live: bool = False
    max_position_pct: float = 5.0
    risk_per_trade_pct: float = 0.5
    min_score: int = 75
    max_orders: int = 2

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    symbol: Optional[str] = None

class URLIngestRequest(BaseModel):
    url: str

# --- ENDPOINTS ---

# 1. Authentication APIs (Nubra API Proxy)
@app.post("/api/auth/send-otp")
async def send_otp(req: OTPRequest):
    res = await nubra_client.send_phone_otp(req.phone, req.skip_totp, req.temp_token)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@app.post("/api/auth/verify-otp")
async def verify_otp(req: OTPVerifyRequest):
    res = await nubra_client.verify_phone_otp(req.phone, req.otp, req.temp_token)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@app.post("/api/auth/verify-mpin")
async def verify_mpin(req: MPINVerifyRequest):
    pin = req.pin
    if pin == "SAVED_MPIN" or not pin:
        if nubra_client.saved_mpin:
            pin = nubra_client.saved_mpin
        else:
            raise HTTPException(status_code=400, detail="No saved MPIN found. Please enter MPIN manually.")
            
    res = await nubra_client.verify_mpin(pin, req.auth_token)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@app.post("/api/auth/save-credentials")
def save_credentials(req: SaveCredentialsRequest):
    nubra_client.saved_phone = req.phone
    nubra_client.saved_mpin = req.mpin
    if req.device_id:
        nubra_client.device_id = req.device_id
    nubra_client.save_session()
    return {"success": True, "message": "Credentials saved successfully"}

@app.get("/api/auth/credentials")
def get_credentials():
    return {
        "phone_saved": nubra_client.saved_phone is not None,
        "mpin_saved": nubra_client.saved_mpin is not None,
        "phone": nubra_client.saved_phone
    }

@app.post("/api/auth/clear-credentials")
def clear_credentials():
    nubra_client.session_token = None
    nubra_client.saved_phone = None
    nubra_client.saved_mpin = None
    nubra_client.save_session()
    return {"success": True, "message": "Credentials cleared"}

@app.post("/api/auth/toggle-mock")
def toggle_mock(enabled: bool):
    nubra_client.set_mock_mode(enabled)
    return {"mock_mode": nubra_client.mock_mode}

@app.get("/api/auth/status")
def get_auth_status():
    return {
        "authenticated": nubra_client.session_token is not None,
        "account_data_connected": bool(nubra_client.session_token and not nubra_client.mock_mode),
        "mock_mode": nubra_client.mock_mode,
        "device_id": nubra_client.device_id,
        "phone_saved": nubra_client.saved_phone is not None,
        "mpin_saved": nubra_client.saved_mpin is not None,
        "phone": nubra_client.saved_phone
    }

@app.post("/api/auth/verify-session")
async def verify_session():
    valid = await nubra_client.check_session_validity()
    return {
        "valid": valid,
        "authenticated": nubra_client.session_token is not None,
        "mock_mode": nubra_client.mock_mode,
        "device_id": nubra_client.device_id,
        "phone": nubra_client.saved_phone
    }

@app.get("/api/system/status")
async def get_system_status():
    validation = await nubra_client.validate_endpoints()
    return {
        "backend": {
            "status": "online",
            "time": get_market_session_details()["last_updated"]
        },
        "market": get_market_session_details(),
        "nubra": {
            "authenticated": nubra_client.session_token is not None,
            "mock_mode": nubra_client.mock_mode,
            "device_id": nubra_client.device_id,
            "phone_saved": nubra_client.saved_phone is not None,
            "mpin_saved": nubra_client.saved_mpin is not None,
            "validation": validation
        },
        "data": {
            "market_data": market_data_health,
            "providers": providers_stats
        }
    }

# 2. Market Overview & Data APIs
@app.get("/api/market/overview")
async def get_market_overview():
    """
    Returns market health statistics based on Nifty indices.
    """
    session_details = get_market_session_details()
    
    nifty_task = fetch_live_price("NIFTY")
    sensex_task = fetch_live_price("SENSEX")
    banknifty_task = fetch_live_price("BANKNIFTY")
    midcap_task = fetch_live_price("NIFTY MIDCAP 100")
    nifty_candles_task = fetch_historical_candles("NIFTY", period="5d", interval="1h")
    sensex_candles_task = fetch_historical_candles("SENSEX", period="5d", interval="1h")
    banknifty_candles_task = fetch_historical_candles("BANKNIFTY", period="5d", interval="1h")
    midcap_candles_task = fetch_historical_candles("NIFTY MIDCAP 100", period="5d", interval="1h")
    
    results = await asyncio.gather(
        nifty_task, sensex_task, banknifty_task, midcap_task,
        nifty_candles_task, sensex_candles_task, banknifty_candles_task, midcap_candles_task
    )
    nifty, sensex, banknifty, midcap = results[:4]
    nifty_candles, sensex_candles, banknifty_candles, midcap_candles = results[4:]
    
    def sparkline(candles):
        return [c["close"] for c in candles.get("candles", [])[-15:]] if candles.get("success") else []
    
    def index_entry(data, spark):
        return {
            "price": data.get("price"),
            "change": data.get("change"),
            "sparkline": spark,
            "data_available": bool(data.get("success")),
            "provider": data.get("provider"),
            "last_updated": data.get("last_updated", data.get("timestamp"))
        }
    
    return {
        "market_status": session_details,
        "market_health": {
            "score": 7.5,
            "sentiment": "Constructive",
            "suggested_exposure": "75%"
        },
        "indices": {
            "nifty": index_entry(nifty, sparkline(nifty_candles)),
            "sensex": index_entry(sensex, sparkline(sensex_candles)),
            "banknifty": index_entry(banknifty, sparkline(banknifty_candles)),
            "midcap": index_entry(midcap, sparkline(midcap_candles))
        }
    }

async def fetch_opportunity_data(op: Dict[str, Any]) -> Dict[str, Any]:
    symbol = op["symbol"]
    # Fetch price and 3-month daily candles for dynamic score calculation
    price_task = fetch_live_price(symbol)
    hist_task = fetch_historical_candles(symbol, period="3mo", interval="1d")
    
    price_info, hist = await asyncio.gather(price_task, hist_task)
    if not price_info.get("success") or not hist.get("success") or len(hist.get("candles", [])) < 20:
        return {**op, "price": None, "change": None, "score": None, "data_available": False, "status": "Data unavailable", "provider": price_info.get("provider"), "last_updated": price_info.get("last_updated", price_info.get("timestamp")), "sparkline": []}
    
    op_copy = op.copy()
    op_copy["price"] = price_info.get("price")
    op_copy["change"] = price_info.get("change")
    
    # Dynamic Scoring Engine Integration
    candles = hist.get("candles", [])
    metrics = calculate_technical_indicators_and_score(candles, symbol, op["sector"])
    
    op_copy["score"] = metrics["score"]
    op_copy["signal_tags"] = metrics["signal_tags"]
    op_copy["sparkline"] = [c["close"] for c in candles[-10:]] if candles else []
    
    return op_copy

@app.get("/api/market/opportunities")
async def get_opportunities():
    """Compatibility route backed by the live opportunity scan."""
    return await scan_market_opportunities()

async def scan_market_opportunities() -> List[Dict[str, Any]]:
    # Fetch Nifty candles once for Relative Strength calculation
    nifty_hist = await fetch_historical_candles("NIFTY", period="6mo", interval="1d")
    nifty_candles = nifty_hist.get("candles", [])

    sem = asyncio.Semaphore(3) # Max 3 concurrent requests to avoid rate limits

    async def scan_one(op: Dict[str, Any]) -> Dict[str, Any]:
        symbol = op["symbol"]
        async with sem:
            price_task = fetch_live_price(symbol)
            hist_task = fetch_historical_candles(symbol, period="6mo", interval="1d")
            price_info, hist = await asyncio.gather(price_task, hist_task)
            await asyncio.sleep(0.15) # Spacing delay between fetches
            
        candles = hist.get("candles", [])

        if not price_info.get("success") or len(candles) < 60:
            return {**op, "score": 0, "data_available": False, "status": "Data Unavailable", "sparkline": []}

        metrics = calculate_technical_indicators_and_score(
            candles, symbol, op["sector"], nifty_candles=nifty_candles
        )
        closes = [float(c["close"]) for c in candles]
        highs = [float(c["high"]) for c in candles]
        lows = [float(c["low"]) for c in candles]
        last_price = float(price_info.get("price") or closes[-1])
        support = min(lows[-20:])
        resistance = max(highs[-20:])
        stop = round(support * 0.995, 2)
        entry_low = round(last_price * 0.995, 2)
        entry_high = round(min(last_price * 1.01, resistance * 1.01), 2)
        target = round(max(resistance * 1.03, last_price + (last_price - stop) * 2), 2)
        risk = max(entry_low - stop, 0.01)
        reward = max(target - entry_low, 0)
        risk_reward = round(reward / risk, 2)
        upside_pct = round(((target - last_price) / last_price) * 100, 2) if last_price else 0

        # Define setup status according to experienced Indian swing trader logic
        if metrics["score"] >= 90:
            setup_status = "Confirmed Breakout"
        elif metrics["score"] >= 80:
            setup_status = "Favorable Entry"
        elif metrics["score"] >= 70:
            setup_status = "Developing Setup"
        else:
            setup_status = "Watchlist"

        return {
            **op,
            "ref_id": KNOWN_NUBRA_REF_IDS.get(symbol),
            "price": last_price,
            "change": price_info.get("change"),
            "score": metrics["score"],
            "setup": setup_status,
            "status": setup_status,
            "signal_tags": metrics["signal_tags"],
            "entry": f"INR {entry_low:,.2f} - {entry_high:,.2f}",
            "target": f"INR {target:,.2f}",
            "stop": f"INR {stop:,.2f}",
            "risk_reward": risk_reward,
            "upside_pct": upside_pct,
            "holding_period": "3-12 sessions",
            "provider": hist.get("provider", "Unknown"),
            "data_timestamp": hist.get("timestamp"),
            "sparkline": closes[-20:],
            "data_available": True,
        }

    scanned = await asyncio.gather(*[scan_one(op) for op in LIQUID_SWING_UNIVERSE])
    valid = [
        op for op in scanned
        if op.get("data_available") and op.get("score", 0) >= 35 and op.get("risk_reward", 0) >= 1.0
    ]
    return sorted(valid, key=lambda op: (op.get("score", 0), op.get("risk_reward", 0)), reverse=True)[:10]

@app.get("/api/market/opportunities-v2")
async def get_opportunities_v2():
    return await scan_market_opportunities()

async def build_current_trade_plans(req: AutomationRequest) -> Dict[str, Any]:
    opportunities = await scan_market_opportunities()
    portfolio = await get_portfolio_stats()
    funds = portfolio.get("funds", {}) if portfolio.get("status") != "error" else {}
    available_cash = float(funds.get("net_margin_available") or 0.0)
    plans = [
        build_trade_plan(
            op,
            available_cash=available_cash,
            max_position_pct=req.max_position_pct,
            risk_per_trade_pct=req.risk_per_trade_pct,
            min_score=req.min_score,
        )
        for op in opportunities
    ]
    plans = sorted(plans, key=lambda plan: plan["score"], reverse=True)
    return {
        "available_cash": available_cash,
        "market_open": is_market_open_now(),
        "dry_run": req.dry_run,
        "plans": plans,
        "risk": {
            "max_position_pct": req.max_position_pct,
            "risk_per_trade_pct": req.risk_per_trade_pct,
            "min_score": req.min_score,
            "max_orders": req.max_orders,
        },
    }

@app.get("/api/market/compare")
async def compare_stocks(sym1: str, sym2: str):
    sym1 = sym1.upper().strip()
    sym2 = sym2.upper().strip()
    
    # Fetch Nifty history for Relative Strength comparison
    nifty_task = fetch_historical_candles("NIFTY", period="6mo", interval="1d")
    price1_task = fetch_live_price(sym1)
    price2_task = fetch_live_price(sym2)
    hist1_task = fetch_historical_candles(sym1, period="6mo", interval="1d")
    hist2_task = fetch_historical_candles(sym2, period="6mo", interval="1d")
    
    nifty_hist, price1, price2, hist1, hist2 = await asyncio.gather(
        nifty_task, price1_task, price2_task, hist1_task, hist2_task
    )
    
    candles1 = hist1.get("candles", [])
    candles2 = hist2.get("candles", [])
    nifty_candles = nifty_hist.get("candles", [])
    
    if not price1.get("success") or not price2.get("success") or len(candles1) < 20 or len(candles2) < 20:
        raise HTTPException(
            status_code=400,
            detail=f"Historical data or live quotes are currently unavailable for one or both symbols ({sym1}, {sym2})."
        )
        
    metrics1 = calculate_technical_indicators_and_score(candles1, sym1, nifty_candles=nifty_candles)
    metrics2 = calculate_technical_indicators_and_score(candles2, sym2, nifty_candles=nifty_candles)
    
    p1 = float(price1.get("price") or candles1[-1]["close"])
    p2 = float(price2.get("price") or candles2[-1]["close"])
    c1 = float(price1.get("change") or 0.0)
    c2 = float(price2.get("change") or 0.0)
    
    def get_params(candles, price, metrics):
        closes = [float(c["close"]) for c in candles]
        highs = [float(c["high"]) for c in candles]
        lows = [float(c["low"]) for c in candles]
        support = min(lows[-20:])
        resistance = max(highs[-20:])
        stop = round(support * 0.995, 2)
        entry_low = round(price * 0.995, 2)
        entry_high = round(min(price * 1.01, resistance * 1.01), 2)
        target = round(max(resistance * 1.03, price + (price - stop) * 2), 2)
        risk = max(entry_low - stop, 0.01)
        reward = max(target - entry_low, 0)
        risk_reward = round(reward / risk, 2)
        
        if metrics["score"] >= 90:
            setup = "Confirmed Breakout"
        elif metrics["score"] >= 80:
            setup = "Favorable Entry"
        elif metrics["score"] >= 70:
            setup = "Developing Setup"
        else:
            setup = "Watchlist"
        return {
            "entry": f"INR {entry_low:,.2f} - {entry_high:,.2f}",
            "target": f"INR {target:,.2f}",
            "stop": f"INR {stop:,.2f}",
            "risk_reward": risk_reward,
            "setup": setup
        }
        
    params1 = get_params(candles1, p1, metrics1)
    params2 = get_params(candles2, p2, metrics2)
    
    stronger_score = sym1 if metrics1["score"] > metrics2["score"] else sym2 if metrics2["score"] > metrics1["score"] else "Tie"
    
    summary = (
        f"**Technical Comparison Summary**:  \n"
        f"- **Setup Quality**: **{stronger_score}** is technical leader (Score: {max(metrics1['score'], metrics2['score'])} vs {min(metrics1['score'], metrics2['score'])}).  \n"
        f"- **Trend Structure**: {sym1} exhibits a *{metrics1['trend']['status']}* compared to {sym2}'s *{metrics2['trend']['status']}*.  \n"
        f"- **Relative Strength**: {sym1} is *{metrics1['relative_strength']['status']}* ({metrics1['relative_strength']['value']:+.1f}% vs Nifty) vs {sym2}'s *{metrics2['relative_strength']['status']}* ({metrics2['relative_strength']['value']:+.1f}% vs Nifty).  \n"
        f"- **Momentum (RSI)**: {sym1}'s RSI is **{metrics1['rsi']['value']}** ({metrics1['rsi']['status']}) vs {sym2}'s **{metrics2['rsi']['value']}** ({metrics2['rsi']['status']})."
    )
    
    return {
        "sym1": {
            "symbol": sym1,
            "price": p1,
            "change": c1,
            "trend": metrics1["trend"]["status"],
            "rsi_value": metrics1["rsi"]["value"],
            "rsi_status": metrics1["rsi"]["status"],
            "volume_value": metrics1["volume"]["value"],
            "volume_status": metrics1["volume"]["status"],
            "rs_value": metrics1["relative_strength"]["value"],
            "rs_status": metrics1["relative_strength"]["status"],
            "ma_structure": ", ".join(metrics1["trend"]["details"][:3]),
            "score": metrics1["score"],
            "entry": params1["entry"],
            "target": params1["target"],
            "stop": params1["stop"],
            "risk_reward": params1["risk_reward"],
            "setup": params1["setup"]
        },
        "sym2": {
            "symbol": sym2,
            "price": p2,
            "change": c2,
            "trend": metrics2["trend"]["status"],
            "rsi_value": metrics2["rsi"]["value"],
            "rsi_status": metrics2["rsi"]["status"],
            "volume_value": metrics2["volume"]["value"],
            "volume_status": metrics2["volume"]["status"],
            "rs_value": metrics2["relative_strength"]["value"],
            "rs_status": metrics2["relative_strength"]["status"],
            "ma_structure": ", ".join(metrics2["trend"]["details"][:3]),
            "score": metrics2["score"],
            "entry": params2["entry"],
            "target": params2["target"],
            "stop": params2["stop"],
            "risk_reward": params2["risk_reward"],
            "setup": params2["setup"]
        },
        "summary": summary
    }

# 3. Stock Detail & AI Summary & Chat APIs
@app.get("/api/stock/{symbol}/details")
async def get_stock_details(symbol: str, exchange: str = "NSE"):
    price_task = fetch_live_price(symbol, exchange)
    hist_task = fetch_historical_candles(symbol, exchange, period="3mo", interval="1d")
    nifty_task = fetch_historical_candles("NIFTY", period="3mo", interval="1d")
    
    price_info, hist, nifty_hist = await asyncio.gather(price_task, hist_task, nifty_task)
    
    # Query vector store for custom playbook guides
    context = rag.query_playbooks(f"swing trading rules for {symbol}")
    
    price = price_info.get("price")
    change = price_info.get("change")
    
    candles = hist.get("candles", [])
    nifty_candles = nifty_hist.get("candles", [])
    metrics = calculate_technical_indicators_and_score(candles, symbol, nifty_candles=nifty_candles)
    
    data_is_usable = price is not None and len(candles) >= 20
    scrip_data = {
        "symbol": symbol,
        "exchange": exchange,
        "price": price,
        "change": change,
        "score": metrics["score"],
        "rsi": metrics["rsi"]["value"],
        "volume_ratio": metrics["volume"]["value"]
    }
    
    if data_is_usable:
        closes = [float(c["close"]) for c in candles]
        highs = [float(c["high"]) for c in candles]
        lows = [float(c["low"]) for c in candles]
        support = min(lows[-20:])
        resistance = max(highs[-20:])
        stop = round(support * 0.995, 2)
        entry_low = round(price * 0.995, 2)
        entry_high = round(min(price * 1.01, resistance * 1.01), 2)
        target = round(max(resistance * 1.03, price + (price - stop) * 2), 2)
        risk = max(entry_low - stop, 0.01)
        reward = max(target - entry_low, 0)
        risk_reward = round(reward / risk, 2)
        upside_pct = round(((target - price) / price) * 100, 2)
        
        # Setup Type
        if metrics["score"] >= 90:
            setup_type = "Confirmed Breakout"
        elif metrics["score"] >= 80:
            setup_type = "Favorable Entry"
        elif metrics["score"] >= 70:
            setup_type = "Developing Setup"
        else:
            setup_type = "Watchlist"
            
        entry = f"₹{entry_low:.2f} - ₹{entry_high:.2f}"
        target_str = f"₹{target:.2f}"
        stop_loss_str = f"₹{stop:.2f}"
        confidence = 5 if metrics["score"] >= 90 else 4 if metrics["score"] >= 80 else 3 if metrics["score"] >= 70 else 2
        
        if os.environ.get("GEMINI_API_KEY"):
            ai_summary = await asyncio.to_thread(rag.analyze_stock_with_context, scrip_data, context)
        else:
            ai_summary = f"""### Swing Strategy Analysis for {symbol}

*   **Current Price**: ₹{price:.2f} ({change:+.2f}%)
*   **Setup Type**: {setup_type} (Score: **{metrics['score']}**)
*   **Entry Zone**: {entry}
*   **Target**: {target_str} (Potential Upside: **{upside_pct:.1f}%**)
*   **Stop Loss**: {stop_loss_str}
*   **Risk-Reward Ratio**: **{risk_reward}:1**

#### Technical Evaluation
*   **Trend Structure**: {metrics['trend']['status']}. Price is currently trading {metrics['trend']['details'][0].lower()} and {metrics['trend']['details'][1].lower()}.
*   **Momentum (RSI)**: {metrics['rsi']['value']} ({metrics['rsi']['status']}).
*   **Volume Profile**: Volume is currently {metrics['volume']['status']} ({metrics['volume']['value']} of 20-period average).
*   **MACD Status**: {metrics['macd']['status']} (Histogram: {metrics['macd']['hist']}).
*   **Relative Strength**: {metrics['relative_strength']['status']} (Relative performance: {metrics['relative_strength']['value']:+.1f}% vs Nifty 50).

#### Trading Rules & Invalidation
The setup invalidates on a daily close below the support/Stop Loss level of **{stop_loss_str}**. Risk exposure should be limited to **5% of capital** per signal.
*   **Data Timestamp**: {hist.get('timestamp')}
*   **Source**: {hist.get('provider')}"""
    else:
        ai_summary = "No reliable recommendation can be generated because live quote or OHLCV history could not be fetched from the configured market data providers."
        entry = "Awaiting data"
        target_str = "Awaiting data"
        stop_loss_str = "Awaiting data"
        confidence = 0
        
    return {
        "symbol": symbol,
        "name": f"{symbol} Ltd.",
        "ref_id": KNOWN_NUBRA_REF_IDS.get(symbol.upper().strip()),
        "ref_id_status": "resolved" if KNOWN_NUBRA_REF_IDS.get(symbol.upper().strip()) else "missing_instrument_ref",
        "sector": metrics["trend"]["details"][0] if metrics["trend"]["details"] else "Other",
        "price": price,
        "change": change,
        "data_available": data_is_usable,
        "provider": hist.get("provider", price_info.get("provider")),
        "data_timestamp": hist.get("timestamp", price_info.get("timestamp")),
        "candles": candles[-120:],
        "indicators": {
            "trend": {
                "status": metrics["trend"]["status"],
                "details": metrics["trend"]["details"]
            },
            "rsi": {
                "value": metrics["rsi"]["value"],
                "status": metrics["rsi"]["status"]
            },
            "volume": {
                "value": metrics["volume"]["value"],
                "status": metrics["volume"]["status"]
            },
            "risk": {
                "value": metrics["risk"]["value"],
                "details": metrics["risk"]["details"]
            }
        },
        "ai_summary": ai_summary,
        "parameters": {
            "entry": entry,
            "target": target_str,
            "stop_loss": stop_loss_str,
            "holding_period": "2 - 4 weeks",
            "confidence": confidence,
            "entry_low": entry_low if 'entry_low' in locals() else None,
            "entry_high": entry_high if 'entry_high' in locals() else None,
            "target_num": target if 'target' in locals() else None,
            "stop_num": stop if 'stop' in locals() else None
        },
        "openui": build_single_stock_analysis_ui(symbol, {
            "price": price,
            "change": change,
            "candles": candles,
            "parameters": {
                "entry": entry,
                "target": target_str,
                "stop_loss": stop_loss_str,
                "risk_reward": str(risk_reward) if 'risk_reward' in locals() else "2.0",
                "holding_period": "2 - 4 weeks"
            },
            "indicators": metrics
        }, context)
    }

@app.post("/api/stock/{symbol}/chat")
async def chat_stock(symbol: str, req: ChatRequest):
    message = req.message.strip()
    message_lower = message.lower()
    
    # Fetch details for active stock
    price_info = await fetch_live_price(symbol)
    hist = await fetch_historical_candles(symbol, period="3mo", interval="1d")
    candles = hist.get("candles", [])
    if not price_info.get("success") or not hist.get("success") or len(candles) < 20:
        raise HTTPException(status_code=503, detail=f"Live quote or historical data is unavailable for {symbol}.")
    metrics = calculate_technical_indicators_and_score(candles, symbol)
    
    # Query playbook context
    playbook_context = rag.query_playbooks(message)
    
    # Parse trade details
    price = price_info.get("price") or 100.0
    change = price_info.get("change") or 0.0
    
    stock_details = {
        "symbol": symbol,
        "price": price,
        "change": change,
        "candles": candles,
        "parameters": {
            "entry": f"₹{price * 0.98:.2f} - ₹{price * 1.01:.2f}",
            "target": f"₹{price * 1.15:.2f}",
            "stop_loss": f"₹{price * 0.94:.2f}",
            "risk_reward": "2.5",
            "holding_period": "2-4 weeks"
        },
        "indicators": metrics
    }
    
    # Try calling Gemini to generate OpenUI code
    openui_code = None
    if os.environ.get("GEMINI_API_KEY"):
        openui_code = await generate_openui_with_llm(message, req.history, {
            "active_symbol": symbol,
            "stock_details": {
                "symbol": symbol,
                "price": price,
                "change": change,
                "indicators": metrics
            },
            "playbook_context": playbook_context
        })
        
    if not openui_code:
        # Fallback to deterministic builders based on keywords
        if "volume" in message_lower:
            openui_code = f'root = VolumeChart("{symbol}", [], 90)'
        elif "rsi" in message_lower or "momentum" in message_lower:
            openui_code = f'root = RSIChart("{symbol}", [], 90)'
        elif any(kw in message_lower for kw in ["macd", "trend", "ema", "sma", "moving average"]):
            ind_name = "MACD" if "macd" in message_lower else "EMA Structure"
            openui_code = build_indicator_chart_ui(symbol, ind_name, stock_details)
        elif any(kw in message_lower for kw in ["setup", "trade", "entry", "exit", "stop", "target", "invalidate", "level", "stoploss"]):
            openui_code = build_trade_review_ui(symbol, f"₹{price*0.98:.2f} - ₹{price*1.01:.2f}", f"₹{price*1.15:.2f}", f"₹{price*0.94:.2f}", stock_details, playbook_context)
        else:
            # Default to full stock analysis
            openui_code = build_single_stock_analysis_ui(symbol, stock_details, playbook_context)
            
    # Text answer for conversational fallback
    text_answer = f"Visual response generated for {symbol}."
    if "rsi" in message_lower:
        text_answer = f"The RSI (14) for {symbol} is currently {metrics['rsi']['value']} ({metrics['rsi']['status']})."
    elif "macd" in message_lower:
        text_answer = f"The MACD status for {symbol} is {metrics['macd']['status']}."
    elif "invalidate" in message_lower or "stop" in message_lower:
        text_answer = f"The setup for {symbol} invalidates if price closes below the stop loss at ₹{price * 0.94:.2f}."
        
    return {
        "answer": text_answer,
        "openui": openui_code
    }

def _build_fallback_answer(message_lower: str, playbook_context: str, active_symbol: str = None) -> str:
    """Built-in knowledge base for answering common trading questions without Gemini."""
    knowledge_base = {
        "rsi": (
            "### Relative Strength Index (RSI)\n\n"
            "RSI is a momentum oscillator ranging from 0 to 100 that measures the speed and magnitude of recent price changes.\n\n"
            "**Key Thresholds:**\n"
            "- **RSI ≥ 70** → Overbought territory — the stock may be due for a pullback\n"
            "- **RSI ≤ 30** → Oversold territory — potential buying opportunity\n"
            "- **RSI 40-60** → Neutral zone, trend-following signals are more reliable here\n\n"
            "**Swing Trading Application:**\n"
            "- In a strong uptrend, RSI often oscillates between **40 and 80**, with the 40-50 zone acting as support\n"
            "- Avoid selling purely based on RSI > 70 if volume expansion is above 2x the 20-period average — this signals a genuine breakout\n"
            "- RSI divergences (price making new highs while RSI makes lower highs) can signal trend weakness"
        ),
        "macd": (
            "### MACD (Moving Average Convergence Divergence)\n\n"
            "MACD is a trend-following momentum indicator that shows the relationship between two moving averages of a stock's price.\n\n"
            "**Components:**\n"
            "- **MACD Line** = 12-period EMA − 26-period EMA\n"
            "- **Signal Line** = 9-period EMA of the MACD Line\n"
            "- **Histogram** = MACD Line − Signal Line\n\n"
            "**Trading Signals:**\n"
            "- **Bullish Crossover**: MACD line crosses above the signal line → potential buy signal\n"
            "- **Bearish Crossover**: MACD line crosses below the signal line → potential sell signal\n"
            "- **Divergence**: When price and MACD move in opposite directions, it can indicate a trend reversal\n"
            "- Histogram expanding = increasing momentum; contracting = weakening momentum"
        ),
        "swing trad": (
            "### Swing Trading Overview\n\n"
            "Swing trading is a strategy that aims to capture short-to-medium term gains in a stock over a period of **2 days to several weeks**.\n\n"
            "**Core Principles:**\n"
            "- **Follow the trend**: Trade in the direction of the prevailing trend using EMA structure\n"
            "- **Volume confirmation**: Enter only when volume is expanding (ideally > 1.5x average)\n"
            "- **Risk management**: Never risk more than 1-2% of total capital on a single trade\n"
            "- **Clear levels**: Always define Entry, Target, and Stop Loss before entering\n\n"
            "**Typical Swing Setup Checklist:**\n"
            "1. Stock is in an uptrend (price above EMA 20 & EMA 50)\n"
            "2. RSI is in the 40-65 zone (not overbought)\n"
            "3. Volume is expanding on up-days\n"
            "4. Clear support level identified for stop loss placement\n"
            "5. Risk-reward ratio is at least 1:2"
        ),
        "moving average": (
            "### Moving Averages (EMA & SMA)\n\n"
            "Moving averages smooth out price data to identify the direction of the trend.\n\n"
            "**Types:**\n"
            "- **SMA (Simple Moving Average)**: Equal weight to all data points in the period\n"
            "- **EMA (Exponential Moving Average)**: More weight to recent prices, reacts faster to changes\n\n"
            "**Common Periods for Swing Trading:**\n"
            "- **EMA 20**: Short-term trend direction, acts as dynamic support in uptrends\n"
            "- **EMA 50**: Medium-term trend confirmation\n"
            "- **EMA 200**: Long-term trend direction — price above EMA 200 indicates bullish bias\n\n"
            "**Key Signals:**\n"
            "- **Golden Cross**: EMA 50 crosses above EMA 200 → long-term bullish signal\n"
            "- **Death Cross**: EMA 50 crosses below EMA 200 → long-term bearish signal\n"
            "- Price bouncing off EMA 20 in an uptrend = potential entry point"
        ),
        "stop loss": (
            "### Stop Loss Strategy\n\n"
            "A stop loss is a pre-defined price level at which you exit a losing trade to limit your loss.\n\n"
            "**How to Set Stop Loss:**\n"
            "- **Technical Support**: Place stop loss just below a key support level or recent swing low\n"
            "- **ATR-Based**: Use 1.5x to 2x the Average True Range (ATR) below your entry\n"
            "- **Percentage-Based**: Typically 3-7% below entry for swing trades\n\n"
            "**Best Practices:**\n"
            "- Always set your stop loss BEFORE entering the trade\n"
            "- Never widen your stop loss after entering — this is a discipline trap\n"
            "- Consider trailing stop losses to lock in profits as the trade moves in your favor\n"
            "- Risk no more than **1-2% of total capital** per trade"
        ),
        "risk management": (
            "### Risk Management & Position Sizing\n\n"
            "Risk management is the most important factor in long-term trading success.\n\n"
            "**Position Sizing Rules:**\n"
            "- **1% Rule**: Never risk more than 1% of your total trading capital on a single trade\n"
            "- **10% Allocation**: No single position should exceed 10% of your portfolio\n"
            "- **Position Size** = (Risk Amount) ÷ (Entry Price − Stop Loss)\n\n"
            "**Key Principles:**\n"
            "- Always define your maximum loss before entering a trade\n"
            "- Diversify across sectors — avoid concentration in a single sector\n"
            "- Maintain at least 20-30% of capital as cash reserve\n"
            "- After 3 consecutive losing trades, reduce position size by 50% and review strategy"
        ),
        "position siz": (
            "### Position Sizing\n\n"
            "Position sizing determines how many shares to buy based on your risk tolerance.\n\n"
            "**Formula:** Position Size = (Account Risk ÷ Trade Risk)\n"
            "- **Account Risk** = Total Capital × Risk % (e.g., ₹10,00,000 × 1% = ₹10,000)\n"
            "- **Trade Risk** = Entry Price − Stop Loss Price\n\n"
            "**Example:**\n"
            "- Capital: ₹10,00,000 | Risk: 1% = ₹10,000\n"
            "- Entry: ₹150 | Stop Loss: ₹140 | Trade Risk = ₹10\n"
            "- Position Size = ₹10,000 ÷ ₹10 = **1,000 shares**\n\n"
            "Standard playbook recommends allocating no more than **10% of available capital** to any single swing position."
        ),
        "volume": (
            "### Volume Analysis\n\n"
            "Volume measures the number of shares traded and is a key confirmation indicator.\n\n"
            "**Volume Signals:**\n"
            "- **Volume Surge (> 2x average)**: Strong institutional interest — confirms breakouts\n"
            "- **Rising price + Rising volume**: Healthy uptrend, trend likely to continue\n"
            "- **Rising price + Declining volume**: Weak rally, potential reversal ahead\n"
            "- **Falling price + High volume**: Distribution phase — smart money exiting\n\n"
            "**Swing Trading Rule:**\n"
            "- Only enter breakout trades when volume is at least **1.5x the 20-day average**\n"
            "- Volume ratio > 2x on breakout day = high-confidence setup"
        ),
        "breakout": (
            "### Breakout Trading\n\n"
            "A breakout occurs when a stock's price moves above a resistance level or below a support level with increased volume.\n\n"
            "**Breakout Checklist:**\n"
            "1. Price closes above the resistance level (not just an intraday spike)\n"
            "2. Volume is at least **2x the 20-day average** on the breakout candle\n"
            "3. RSI is not in extreme overbought territory (< 75 preferred)\n"
            "4. No major resistance overhead within 5-8% of breakout level\n\n"
            "**Entry Strategy:**\n"
            "- Enter on the breakout candle close or on a pullback to the breakout level\n"
            "- Stop loss: Just below the breakout level or the last swing low\n"
            "- Target: Use measured move (height of consolidation pattern) or next resistance level"
        ),
        "support": (
            "### Support & Resistance Levels\n\n"
            "Support and resistance are price levels where buying or selling pressure historically prevents further movement.\n\n"
            "**Support**: A price level where demand is strong enough to prevent further decline\n"
            "**Resistance**: A price level where selling pressure prevents further advance\n\n"
            "**How to Identify:**\n"
            "- Previous swing highs and lows\n"
            "- Round numbers (₹100, ₹500, ₹1,000)\n"
            "- Moving averages (EMA 20, 50, 200)\n"
            "- Volume profile — areas of high trading activity\n\n"
            "**Trading Application:**\n"
            "- Buy near support with stop loss just below\n"
            "- When support breaks, it becomes resistance (and vice versa)\n"
            "- Stronger levels = more times price has bounced off that level"
        ),
        "resistance": (
            "### Support & Resistance Levels\n\n"
            "Support and resistance are key price levels where buying or selling pressure prevents further movement.\n\n"
            "**Support**: A floor where demand prevents further decline\n"
            "**Resistance**: A ceiling where selling pressure prevents further advance\n\n"
            "**Key Rules:**\n"
            "- The more times a level is tested, the stronger it becomes\n"
            "- When resistance breaks with volume, it typically becomes new support\n"
            "- Place stop losses just beyond these levels for optimal risk management"
        ),
        "relative strength": (
            "### Relative Strength (RS)\n\n"
            "Relative Strength compares a stock's performance to a benchmark index (like Nifty 50).\n\n"
            "**Interpretation:**\n"
            "- **RS > 0**: Stock is outperforming the index — bullish bias\n"
            "- **RS < 0**: Stock is underperforming the index — bearish bias\n"
            "- Rising RS + price breakout = high-conviction setup\n\n"
            "**Swing Trading Application:**\n"
            "- Focus on stocks with strong relative strength for long positions\n"
            "- Avoid buying stocks that are underperforming the broader market"
        ),
        "market hour": (
            "### NSE Market Hours\n\n"
            "**Standard Trading Session:**\n"
            "- **Pre-open**: 9:00 AM – 9:15 AM IST\n"
            "- **Normal Trading**: 9:15 AM – 3:30 PM IST\n"
            "- **Closing Session**: 3:30 PM – 3:40 PM IST\n\n"
            "**Trading Days**: Monday to Friday (closed on weekends and exchange-declared holidays)\n\n"
            "**After-Market Orders (AMO)**: Orders placed outside trading hours are queued and executed during the next pre-open session."
        ),
        "when does market": (
            "### NSE Market Timings\n\n"
            "The Indian stock market (NSE) operates from **9:15 AM to 3:30 PM IST**, Monday through Friday.\n\n"
            "- **Pre-open session**: 9:00 AM – 9:15 AM\n"
            "- **Regular trading**: 9:15 AM – 3:30 PM\n"
            "- Closed on weekends and national holidays declared by NSE"
        ),
        "golden cross": (
            "### Golden Cross & Death Cross\n\n"
            "**Golden Cross**: When the 50-day moving average crosses ABOVE the 200-day moving average → long-term bullish signal.\n\n"
            "**Death Cross**: When the 50-day moving average crosses BELOW the 200-day moving average → long-term bearish signal.\n\n"
            "**Trading Note:**\n"
            "- These are lagging indicators — they confirm a trend that's already underway\n"
            "- Use them for directional bias, not precise entry/exit timing\n"
            "- Combine with volume and RSI for higher confidence"
        ),
        "death cross": (
            "### Death Cross\n\n"
            "A death cross occurs when the 50-day moving average crosses BELOW the 200-day moving average, signaling a potential long-term bearish trend.\n\n"
            "- It's a lagging indicator that confirms existing downward momentum\n"
            "- Combine with other indicators like RSI and volume for confirmation\n"
            "- Not every death cross leads to a crash — context matters"
        ),
    }

    # Greeting handling
    greeting_words = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "howdy", "sup"]
    if any(message_lower.strip().startswith(g) for g in greeting_words) or message_lower.strip() in greeting_words:
        symbol_note = f" I see you're currently researching **{active_symbol}** — feel free to ask me anything about it!" if active_symbol else ""
        return (
            "### 👋 Hello!\n\n"
            f"Welcome to Stalk Market's Research Assistant.{symbol_note}\n\n"
            "I can help you with:\n"
            "- **Stock Analysis**: Technical indicators, score breakdowns, and trade setups\n"
            "- **Trading Concepts**: RSI, MACD, moving averages, breakout strategies\n"
            "- **Risk Management**: Position sizing, stop loss strategies, portfolio rules\n"
            "- **Market Info**: Trading hours, session timings, order types\n\n"
            "Just type your question and I'll find the best answer from the strategy playbook!"
        )

    # Help / capabilities handling
    if any(kw in message_lower for kw in ["what can you do", "help", "capabilities", "what is stalk market", "what are you"]):
        return (
            "### 🧠 Stalk Market Research Assistant\n\n"
            "I'm **Scout**, your AI-powered trading research companion. Here's what I can do:\n\n"
            "**📊 Market Analysis:**\n"
            "- Analyze any stock's technical indicators (RSI, MACD, EMA structure)\n"
            "- Generate AI scoring and breakdowns for swing trade setups\n"
            "- Compare two stocks side by side\n\n"
            "**📚 Knowledge Base:**\n"
            "- Answer questions about trading concepts, strategies, and terminology\n"
            "- Reference your uploaded playbook strategies\n"
            "- Provide risk management and position sizing guidance\n\n"
            "**🎯 Trade Planning:**\n"
            "- Review trade setups with entry, target, and stop loss analysis\n"
            "- Evaluate risk-reward ratios\n"
            "- Scan for breakout opportunities\n\n"
            "Try asking things like *\"What is RSI?\"*, *\"Analyze HFCL\"*, or *\"Show me the strongest setups\"*."
        )

    # Knowledge base keyword matching
    matched_answer = None
    for keyword, answer in knowledge_base.items():
        if keyword in message_lower:
            matched_answer = answer
            break

    # Also check for EMA/SMA specifically
    if not matched_answer and any(kw in message_lower for kw in ["ema", "sma"]):
        matched_answer = knowledge_base["moving average"]

    # Build the final response
    if matched_answer:
        if playbook_context and len(playbook_context.strip()) > 20:
            matched_answer += (
                "\n\n---\n\n"
                "#### 📖 Related Playbook Insights\n\n"
                f"{playbook_context[:500]}"
            )
        return matched_answer

    if playbook_context and len(playbook_context.strip()) > 20:
        return (
            f"### Strategy Insights\n\n"
            f"Here's what I found in the strategy playbook relevant to your question:\n\n"
            f"{playbook_context[:600]}\n\n"
            f"---\n\n"
            f"**General Recommendations:**\n"
            f"- Always confirm setups with volume expansion (> 1.5x average)\n"
            f"- Verify RSI is not in extreme overbought territory before buying breakouts\n"
            f"- Maintain strict position sizing — risk no more than 1-2% per trade"
        )

    # Default fallback — always helpful, never an error
    symbol_note = f" regarding **{active_symbol}**" if active_symbol else ""
    return (
        f"### Trading Insights{symbol_note}\n\n"
        f"Thanks for your question! Here are some key principles from the strategy playbook that may help:\n\n"
        f"**📋 Core Swing Trading Rules:**\n"
        f"- **Trend Confirmation**: Only trade in the direction of the prevailing trend (price above EMA 20 & 50)\n"
        f"- **Volume Validation**: Enter breakouts only when volume exceeds 1.5x the 20-day average\n"
        f"- **RSI Check**: Ensure RSI is not in extreme overbought (> 75) territory before entering longs\n"
        f"- **Risk Management**: Risk no more than 1-2% of total capital per trade\n"
        f"- **Position Sizing**: No single position should exceed 10% of your total portfolio\n\n"
        f"**💡 Tip**: Try asking about specific concepts like *\"What is RSI?\"*, *\"How does MACD work?\"*, "
        f"or analyze a specific stock by name for more targeted insights."
    )

async def _general_chat_impl(req: ChatRequest):
    message = req.message.strip()
    message_lower = message.lower()
    
    # Extract active symbol context from text using resolve_single_symbol
    active_symbol = resolve_single_symbol(message)
    if not active_symbol and req.symbol:
        active_symbol = req.symbol
        
    if not active_symbol:
        # Prompt user if they triggered a specific research flow but no stock symbol was resolved
        if any(kw in message_lower for kw in ["analyze", "look", "how is", "technical analysis", "price action"]):
            return {
                "responseType": "TextResponse",
                "data": {
                    "text": "### 🔍 Stock Analysis\n\nWhich stock would you like to analyze? Please type a company name like **Tata Motors**, **Reliance**, or **Infosys**."
                },
                "sources": ["Scout Assistant Router"],
                "suggestedFollowUps": ["Analyze Tata Motors", "Analyze Reliance", "Analyze Infosys"]
            }
        elif any(kw in message_lower for kw in ["compare", "vs"]):
            return {
                "responseType": "TextResponse",
                "data": {
                    "text": "### 📊 Stock Comparison\n\nWhich two stocks would you like to compare? You can type company names like **HDFC Bank and ICICI Bank**, or **Tata Motors and TVS Motor**."
                },
                "sources": ["Scout Assistant Router"],
                "suggestedFollowUps": ["Compare HDFC Bank and ICICI Bank", "Compare Tata Motors and TVS Motor", "Compare Infosys and TCS"]
            }
        elif any(kw in message_lower for kw in ["setup", "trade", "entry", "exit", "stop", "target", "invalidate", "level", "stoploss"]):
            return {
                "responseType": "TextResponse",
                "data": {
                    "text": "### 📋 Trade Setup Check\n\nPlease provide the stock name and your trade levels in this format: `Stock: Entry, Target, Stop` (e.g. `Infosys: Entry 1900, Target 2100, Stop 1820`)."
                },
                "sources": ["Scout Assistant Router"],
                "suggestedFollowUps": ["Check trade for Tata Motors", "Check trade for Reliance", "Check trade for HDFC Bank"]
            }
        elif any(kw in message_lower for kw in ["why ranked", "why score", "why is", "why moving", "trigger"]):
            return {
                "responseType": "TextResponse",
                "data": {
                    "text": "### ⚡ Opportunity Score Triggers\n\nWhich stock's score breakdown and triggers would you like to check? (e.g. **Tata Motors**, **TVS Motor**, or **Reliance**)."
                },
                "sources": ["Scout Assistant Router"],
                "suggestedFollowUps": ["Why is Tata Motors moving?", "Why is TVS Motor moving?", "Why is Reliance moving?"]
            }
            
    # Default fallback active symbol if none detected and setup keywords are present
    if not active_symbol and any(kw in message_lower for kw in ["setup", "trade", "entry", "exit", "stop", "target", "score", "breakdown", "rsi", "indicator", "macd"]):
        active_symbol = "HFCL"

    # Common playbook RAG context
    playbook_context = rag.query_playbooks(message)

    # --- 1. Opportunity List Query ---
    if any(kw in message_lower for kw in ["strongest", "opportunity", "opportunities", "setups", "breakout", "discover"]):
        opps = [
            {"symbol": "HFCL", "name": "HFCL Ltd.", "sector": "Telecom", "ref_id": 1755599, "score": 87, "setup": "Volume Surge", "entry": "₹140 - ₹145", "target": "₹172", "stop": "₹136"},
            {"symbol": "KPITTECH", "name": "KPIT Technologies", "sector": "Auto Ancillary", "ref_id": 1755600, "score": 84, "setup": "Breakout + Momentum", "entry": "₹1,430 - ₹1,460", "target": "₹1,650", "stop": "₹1,365"},
            {"symbol": "JBM AUTO", "name": "JBM Auto Ltd.", "sector": "Auto", "ref_id": 1755601, "score": 82, "setup": "Strong Relative Strength", "entry": "₹1,040 - ₹1,060", "target": "₹1,210", "stop": "₹985"},
            {"symbol": "BLS INTL", "name": "BLS International", "sector": "Financials", "ref_id": 1755602, "score": 79, "setup": "Pullback Setup", "entry": "₹340 - ₹350", "target": "₹385", "stop": "₹323"}
        ]
        tasks = [fetch_opportunity_data(op) for op in opps]
        hydrated_opps = await asyncio.gather(*tasks)
        hydrated_opps = sorted(hydrated_opps, key=lambda x: x.get("score", 0), reverse=True)
        
        openui_code = build_opportunity_list_ui(hydrated_opps)
        return {
            "responseType": "OpenUI",
            "data": {
                "openui": openui_code,
                "text": "Here are the top opportunities matching playbook criteria."
            },
            "sources": ["Yahoo Finance Real-time API Gateway", "Deterministic Scoring Engine"],
            "context": {"symbol": active_symbol}
        }

    # --- 2. Stock Comparison Query ---
    if "compare" in message_lower or " vs " in message_lower:
        found_symbols = resolve_multiple_symbols(message)
                
        if len(found_symbols) < 2 and active_symbol:
            if active_symbol not in found_symbols:
                found_symbols.append(active_symbol)
            peer_symbol = "KPITTECH" if active_symbol != "KPITTECH" else "HFCL"
            active_sector = next((x["sector"] for x in LIQUID_SWING_UNIVERSE if x["symbol"] == active_symbol), None)
            if active_sector:
                for x in LIQUID_SWING_UNIVERSE:
                    if x["sector"] == active_sector and x["symbol"] != active_symbol:
                        peer_symbol = x["symbol"]
                        break
            if peer_symbol not in found_symbols:
                found_symbols.append(peer_symbol)
            
        if len(found_symbols) >= 2:
            sym1, sym2 = found_symbols[0], found_symbols[1]
            price1_task = fetch_live_price(sym1)
            price2_task = fetch_live_price(sym2)
            hist1_task = fetch_historical_candles(sym1, period="3mo", interval="1d")
            hist2_task = fetch_historical_candles(sym2, period="3mo", interval="1d")
            
            price1, price2, hist1, hist2 = await asyncio.gather(price1_task, price2_task, hist1_task, hist2_task)
            
            m1 = calculate_technical_indicators_and_score(hist1.get("candles", []), sym1)
            m2 = calculate_technical_indicators_and_score(hist2.get("candles", []), sym2)
            
            stocks_data = [
                {
                    "symbol": sym1,
                    "price": price1.get("price", 0.0),
                    "change": price1.get("change", 0.0),
                    "score": m1["score"],
                    "rsi": m1["rsi"]["value"],
                    "vol_ratio": m1["volume"]["value"],
                    "trend": m1["trend"]["status"]
                },
                {
                    "symbol": sym2,
                    "price": price2.get("price", 0.0),
                    "change": price2.get("change", 0.0),
                    "score": m2["score"],
                    "rsi": m2["rsi"]["value"],
                    "vol_ratio": m2["volume"]["value"],
                    "trend": m2["trend"]["status"]
                }
            ]
            openui_code = build_stock_comparison_ui(stocks_data)
            return {
                "responseType": "OpenUI",
                "data": {
                    "openui": openui_code,
                    "text": f"Comparing {sym1} and {sym2}"
                },
                "sources": ["Yahoo Finance Historical Data", "Yahoo Finance Chart API"],
                "context": {"symbol": active_symbol}
            }

    # --- 3. Indicator Charts Query ---
    if any(kw in message_lower for kw in ["rsi", "macd", "indicator", "moving average", "ema", "trendline", "sma"]):
        indicator_name = "RSI"
        if "macd" in message_lower:
            indicator_name = "MACD"
        elif "ema" in message_lower or "moving average" in message_lower or "sma" in message_lower:
            indicator_name = "EMA Structure"
            
        if active_symbol:
            hist = await fetch_historical_candles(active_symbol, period="3mo", interval="1d")
            candles = hist.get("candles", [])
            metrics = calculate_technical_indicators_and_score(candles, active_symbol)
            price_info = await fetch_live_price(active_symbol)
            
            stock_details = {
                "symbol": active_symbol,
                "price": price_info.get("price") or 0.0,
                "change": price_info.get("change") or 0.0,
                "candles": candles,
                "indicators": metrics
            }
            openui_code = build_indicator_chart_ui(active_symbol, indicator_name, stock_details)
            return {
                "responseType": "OpenUI",
                "data": {
                    "openui": openui_code,
                    "text": f"Technical indicator chart for {active_symbol} ({indicator_name})."
                },
                "sources": ["Yahoo Finance Gateway", "Technical Indicators Calculator"],
                "context": {"symbol": active_symbol}
            }

    # --- 4. Trade Setup Query ---
    if any(kw in message_lower for kw in ["setup", "trade", "entry", "exit", "stop", "target", "invalidate", "level", "stoploss"]):
        if active_symbol:
            price_info = await fetch_live_price(active_symbol)
            ltp = price_info.get("price") or 100.0
            opp_levels = {
                "HFCL": {"entry": "140 - 145", "target": "172", "stop": "136", "rr": "2.3", "upside": "18.6%"},
                "KPITTECH": {"entry": "1,430 - 1,460", "target": "1,650", "stop": "1,365", "rr": "2.1", "upside": "14.2%"},
                "JBM AUTO": {"entry": "1,040 - 1,060", "target": "1,210", "stop": "985", "rr": "2.3", "upside": "15.0%"},
                "BLS INTL": {"entry": "340 - 350", "target": "385", "stop": "323", "rr": "2.0", "upside": "11.6%"}
            }
            levels = opp_levels.get(active_symbol, {
                "entry": f"{ltp * 0.98:.2f} - {ltp * 1.01:.2f}",
                "target": f"{ltp * 1.15:.2f}",
                "stop": f"{ltp * 0.94:.2f}",
                "rr": "2.5",
                "upside": "15.0%"
            })
            
            hist = await fetch_historical_candles(active_symbol, period="3mo", interval="1d")
            candles = hist.get("candles", [])
            metrics = calculate_technical_indicators_and_score(candles, active_symbol)
            stock_details = {
                "symbol": active_symbol,
                "price": ltp,
                "change": price_info.get("change") or 0.0,
                "candles": candles,
                "indicators": metrics
            }
            
            openui_code = build_trade_review_ui(active_symbol, levels["entry"], levels["target"], levels["stop"], stock_details, playbook_context)
            return {
                "responseType": "OpenUI",
                "data": {
                    "openui": openui_code,
                    "code": openui_code,
                    "text": f"Trade setup review for {active_symbol}."
                },
                "sources": ["Deterministic Rules Engine", "Yahoo Finance Gateway"],
                "context": {"symbol": active_symbol}
            }

    # --- 5. Score Breakdown Query ---
    if any(kw in message_lower for kw in ["score", "rank", "breakdown", "why is", "why ranked", "why score"]):
        if active_symbol:
            hist = await fetch_historical_candles(active_symbol, period="3mo", interval="1d")
            candles = hist.get("candles", [])
            metrics = calculate_technical_indicators_and_score(candles, active_symbol)
            price_info = await fetch_live_price(active_symbol)
            
            stock_details = {
                "symbol": active_symbol,
                "price": price_info.get("price") or 0.0,
                "change": price_info.get("change") or 0.0,
                "candles": candles,
                "parameters": {
                    "entry": f"₹{price_info.get('price', 100)*0.98:.2f} - ₹{price_info.get('price', 100)*1.01:.2f}",
                    "target": f"₹{price_info.get('price', 100)*1.15:.2f}",
                    "stop_loss": f"₹{price_info.get('price', 100)*0.94:.2f}",
                    "risk_reward": "2.5",
                    "holding_period": "2-4 weeks"
                },
                "indicators": metrics
            }
            
            openui_code = build_single_stock_analysis_ui(active_symbol, stock_details, playbook_context)
            return {
                "responseType": "OpenUI",
                "data": {
                    "openui": openui_code,
                    "code": openui_code,
                    "text": f"Opportunity score breakdown for {active_symbol}."
                },
                "sources": ["Deterministic Scoring Engine", "Sc Strategy Playbook Metrics"],
                "context": {"symbol": active_symbol}
            }

    # --- 6. Portfolio Risk Query ---
    if any(kw in message_lower for kw in ["portfolio", "cash", "margin", "holdings", "position", "capital", "funds", "money", "balance"]):
        if not nubra_client.session_token and not nubra_client.mock_mode:
            return {
                "responseType": "TextResponse",
                "data": {
                    "text": (
                        "### 🔒 Portfolio Access Required\n\n"
                        "Your **Nubra Broker account is not connected**.\n\n"
                        "Please click the **'Sync Nubra API'** button in the header to authenticate and connect your broker account. Once connected, I will be able to display your available capital, holdings, positions, and execute risk calculations directly."
                    )
                },
                "sources": ["Nubra Client Gateway"],
                "context": {"symbol": active_symbol}
            }
            
        try:
            funds = await nubra_client.get_funds()
            holdings = await nubra_client.get_holdings()
            
            funds_data = funds.get("port_funds_and_margin", {})
            net_margin = funds_data.get("net_margin_available", 0.0)
            blocked_margin = funds_data.get("total_margin_blocked", 0.0)
            sod_funds = funds_data.get("start_of_day_funds", 0.0)
            
            portfolio_wrapper = holdings.get("portfolio", {})
            holdings_list = portfolio_wrapper.get("holdings", [])
            holdings_stats = portfolio_wrapper.get("holding_stats", {})
            invested_amount = holdings_stats.get("invested_amount", 0.0)
            current_value = holdings_stats.get("current_value", 0.0)
            total_pnl = holdings_stats.get("total_pnl", 0.0)
            total_pnl_chg = holdings_stats.get("total_pnl_chg", 0.0)
            
            openui_code = build_portfolio_ui(net_margin, blocked_margin, sod_funds, invested_amount, current_value, total_pnl, total_pnl_chg, holdings_list)
            return {
                "responseType": "OpenUI",
                "data": {
                    "openui": openui_code,
                    "code": openui_code,
                    "text": "Linked broker account funds and holdings summary."
                },
                "sources": ["Nubra Client Gateway", "Broker Risk Analytics Engine"],
                "context": {"symbol": active_symbol}
            }
        except Exception as e:
            return {
                "responseType": "TextResponse",
                "data": {
                    "text": f"### ❌ Portfolio Data Sync Error\n\nFailed to retrieve portfolio details: {str(e)}"
                },
                "sources": ["Nubra Client Gateway"],
                "context": {"symbol": active_symbol}
            }

    # --- 7. Fallback to Playbook RAG / Standard Chat ---
    # Gather financial context for LLM if active_symbol is present
    data_context = {}
    if active_symbol:
        try:
            price_info = await fetch_live_price(active_symbol)
            hist = await fetch_historical_candles(active_symbol, period="3mo", interval="1d")
            candles = hist.get("candles", [])
            metrics = calculate_technical_indicators_and_score(candles, active_symbol)
            data_context = {
                "active_symbol": active_symbol,
                "stock_details": {
                    "symbol": active_symbol,
                    "price": price_info.get("price") or 0.0,
                    "change": price_info.get("change") or 0.0,
                    "indicators": metrics
                },
                "playbook_context": playbook_context
            }
        except Exception:
            pass

    openui_res = None
    if os.environ.get("GEMINI_API_KEY"):
        openui_res = await generate_openui_with_llm(message, req.history, data_context)

    openui_code = None
    suggested_followups = None
    text_summary = None
    if openui_res:
        openui_code = openui_res.get("openui")
        suggested_followups = openui_res.get("suggested_followups")
        text_summary = openui_res.get("text_summary")

    if openui_code:
        return {
            "responseType": "OpenUI",
            "data": {
                "openui": openui_code,
                "code": openui_code,
                "text": text_summary or "Generative UI response loaded successfully."
            },
            "sources": ["Strategy Playbook Index", "Gemini Model"],
            "context": {"symbol": active_symbol},
            "suggestedFollowUps": suggested_followups
        }
    else:
        # Fallback to visual OpenUI builders in offline mode if we resolved a stock
        if active_symbol and data_context.get("stock_details"):
            try:
                details = data_context["stock_details"]
                p_val = details.get("price", 100.0)
                details["parameters"] = {
                    "entry": f"₹{p_val*0.98:,.2f} - ₹{p_val*1.01:,.2f}",
                    "target": f"₹{p_val*1.15:,.2f}",
                    "stop_loss": f"₹{p_val*0.94:,.2f}",
                    "risk_reward": "2.5",
                    "holding_period": "3-12 sessions"
                }
                
                # Check query keywords for specific offline visual components
                if "rsi" in message_lower:
                    offline_openui = build_rsi_visualization_ui(active_symbol, details)
                elif any(kw in message_lower for kw in ["macd", "trend", "ema", "sma", "moving average"]):
                    ind_name = "MACD" if "macd" in message_lower else "EMA Structure"
                    offline_openui = build_indicator_chart_ui(active_symbol, ind_name, details)
                elif any(kw in message_lower for kw in ["setup", "trade", "entry", "exit", "stop", "target", "invalidate", "level", "stoploss"]):
                    offline_openui = build_trade_review_ui(active_symbol, f"₹{p_val*0.98:.2f} - ₹{p_val*1.01:.2f}", f"₹{p_val*1.15:.2f}", f"₹{p_val*0.94:.2f}", details, playbook_context)
                else:
                    offline_openui = build_single_stock_analysis_ui(active_symbol, details, playbook_context)
                    
                if offline_openui:
                    score_val = details.get("indicators", {}).get("score", 75)
                    conversational_text = f"Here is the setup overview for **{active_symbol}**: Trading at **₹{p_val:,.2f}**. Score is **{score_val}/100** with entry setup around **₹{p_val*0.98:,.2f} – ₹{p_val*1.01:,.2f}**."
                    return {
                        "responseType": "OpenUI",
                        "data": {
                            "openui": offline_openui,
                            "code": offline_openui,
                            "text": conversational_text
                        },
                        "sources": ["Offline Strategy Playbook", "Yahoo Finance Gateway"],
                        "context": {"symbol": active_symbol}
                    }
            except Exception as e:
                print(f"ERROR: offline stock analysis UI build failed: {e}")

        # Static text fallback RAG
        fallback_text = _build_fallback_answer(message_lower, playbook_context, active_symbol)
        
        # Also convert fallback_text into a nice OpenUI wrap containing the text response
        fallback_cleaned = fallback_text.replace('"', '\\"').replace('\n', '\\n')
        openui_fallback_code = f"""root = Stack([text, sources])
text = TextResponse("{fallback_cleaned}")
sources = DataSource(["Strategy Playbook Index", "Offline Knowledge Base"])
"""
        return {
            "responseType": "OpenUI",
            "data": {
                "openui": openui_fallback_code,
                "code": openui_fallback_code,
                "text": fallback_text
            },
            "sources": ["Strategy Playbook Index", "Knowledge Base"],
            "context": {"symbol": active_symbol}
        }

def get_contextual_followups(message_lower: str, active_symbol: Optional[str], response_type: str) -> list[str]:
    symbol = (active_symbol or "HFCL").upper().strip()
    
    # 1. Opportunities / Discover Setups
    if any(kw in message_lower for kw in ["strongest", "opportunity", "opportunities", "setups", "breakout", "discover"]):
        return [
            f"What is the entry range for {symbol}?",
            "Which stock has the highest score?",
            "What does the RSI show for these?"
        ]
        
    # 2. Comparison
    if "compare" in message_lower or " vs " in message_lower:
        return [
            "Which stock has stronger trend structure?",
            "Compare the RSI momentum for these",
            "What are the stop loss levels?"
        ]
        
    # 3. Indicators (RSI, MACD, Moving Average)
    if any(kw in message_lower for kw in ["rsi", "macd", "indicator", "moving average", "ema", "sma", "trendline"]):
        return [
            f"What does the price trend show for {symbol}?",
            f"Where are the key support levels for {symbol}?",
            f"Is volume confirming this move on {symbol}?"
        ]
        
    # 4. Trade Setup / Levels
    if any(kw in message_lower for kw in ["setup", "trade", "entry", "exit", "stop", "target", "invalidate", "level", "stoploss"]):
        return [
            f"What is the biggest risk for {symbol}?",
            "Is the risk reward ratio reasonable?",
            f"What would make this setup stronger?"
        ]
        
    # 5. Score Breakdown / Ratings
    if any(kw in message_lower for kw in ["score", "rank", "breakdown", "why is", "why ranked", "why score"]):
        return [
            f"What does the RSI indicate for {symbol}?",
            f"What could invalidate the {symbol} setup?",
            f"Where could I consider an entry for {symbol}?"
        ]
        
    # 6. Portfolio
    if any(kw in message_lower for kw in ["portfolio", "cash", "margin", "holdings", "position", "capital", "funds", "money", "balance"]):
        return [
            "What is my total risk exposure?",
            "How much cash is available for trades?",
            "What is my largest holdings position?"
        ]
        
    # 7. Fallback Default Contextual questions for a specific stock
    if active_symbol:
        return [
            f"Show the swing trade setup for {symbol}",
            f"What is the opportunity score for {symbol}?",
            f"What does the RSI indicate for {symbol}?"
        ]
        
    # 8. General Default questions
    return [
        "What are the top opportunities today?",
        "Explain the swing strategy rules",
        "How do I connect my Nubra broker?"
    ]

@app.post("/api/chat")
async def general_chat(req: ChatRequest):
    res = await _general_chat_impl(req)
    message_lower = req.message.strip().lower()
    active_symbol = res.get("context", {}).get("symbol") if res.get("context") else req.symbol
    
    # Extract followups if returned by Gemini, otherwise generate fallback
    suggested_followups = res.get("suggestedFollowUps")
    if not suggested_followups:
        suggested_followups = get_contextual_followups(message_lower, active_symbol, res.get("responseType", "TextResponse"))
        
    res["suggestedFollowUps"] = suggested_followups
    return res

@app.post("/api/chat/market")
async def chat_market():
    # Fetch market overview indices
    nifty = await fetch_live_price("NIFTY")
    sensex = await fetch_live_price("SENSEX")
    
    # Static list of sector performances
    sectors = [
        {"name": "NIFTY IT", "change": 1.45},
        {"name": "NIFTY AUTO", "change": 0.88},
        {"name": "NIFTY BANK", "change": -0.32},
        {"name": "NIFTY PHARMA", "change": 0.64},
        {"name": "NIFTY METAL", "change": -0.85},
        {"name": "NIFTY FMCG", "change": 0.22}
    ]
    
    # Fetch notable movers
    movers = await scan_market_opportunities()
    
    nifty_price = nifty.get("price") or 24200.50
    nifty_change = nifty.get("change") or 0.50
    sensex_price = sensex.get("price") or 79500.20
    sensex_change = sensex.get("change") or 0.48
    
    from services.openui_generator import build_market_overview_ui
    code = build_market_overview_ui(nifty_price, nifty_change, sensex_price, sensex_change, sectors, movers)
    
    return {
        "responseType": "OpenUI",
        "data": {
            "code": code,
            "openui": code
        },
        "suggestedFollowUps": [
            "What are the top opportunities today?",
            "Analyze Tata Motors",
            "Why is the IT sector leading?"
        ]
    }

@app.post("/api/chat/portfolio")
async def chat_portfolio():
    portfolio = await get_portfolio_stats()
    
    if portfolio.get("status") == "error" or not portfolio.get("holdings") or not portfolio.get("funds"):
        # Return fallback mock portfolio data
        funds = {"net_margin_available": 150000.0, "blocked_margin": 80000.0, "sod_funds": 230000.0}
        invested = 72000.0
        current = 83500.0
        pnl = 11500.0
        pnl_chg = 15.97
        holdings = [
            {"symbol": "INFY", "name": "Infosys Ltd", "qty": 30, "ltp": 1640.2},
            {"symbol": "TATAMOTORS", "name": "Tata Motors Ltd", "qty": 30, "ltp": 1040.0},
            {"symbol": "RELIANCE", "name": "Reliance Industries Ltd", "qty": 1, "ltp": 3104.5}
        ]
    else:
        funds = portfolio.get("funds") or {}
        holdings_dict = portfolio.get("holdings") or {}
        holding_stats = holdings_dict.get("holding_stats") or {}
        invested = float(holding_stats.get("invested_amount") or 0.0)
        current = float(holding_stats.get("current_value") or 0.0)
        pnl = float(holding_stats.get("total_pnl") or 0.0)
        pnl_chg = float(holding_stats.get("total_pnl_chg") or 0.0)
        holdings = holdings_dict.get("holdings") or []
        
    net_margin = float(funds.get("net_margin_available") or 150000.0)
    blocked_margin = float(funds.get("blocked_margin") or 80000.0)
    sod_funds = float(funds.get("sod_funds") or 230000.0)
    
    from services.openui_generator import build_portfolio_ui
    code = build_portfolio_ui(net_margin, blocked_margin, sod_funds, invested, current, pnl, pnl_chg, holdings)
    
    return {
        "responseType": "OpenUI",
        "data": {
            "code": code,
            "openui": code
        },
        "suggestedFollowUps": [
            "Check my margin availability",
            "Show risk factors for INFY",
            "What is Tata Motors' opportunity score?"
        ]
    }

# 4. Playbook Upload (Self-Training Module)
@app.post("/api/playbook/upload")
async def upload_playbook(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Run ingestion
        res = await rag.ingest_document(file_path, file.filename)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload playbook: {str(e)}")

@app.get("/api/playbook/list")
def list_playbooks():
    sources = rag.get_knowledge_sources()
    files = [s["name"] for s in sources if s["type"] == "PDF" and s["status"] == "Indexed"]
    return {
        "sources": sources,
        "files": files,
        "chunks_count": len(rag.vector_store.documents)
    }

@app.post("/api/playbook/upload-url")
async def upload_playbook_url(req: URLIngestRequest):
    try:
        res = await rag.ingest_url(req.url)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest URL: {str(e)}")

@app.get("/api/settings/stats")
async def get_settings_stats():
    data_health = market_data_health.copy()
    
    # 2. Nubra Connection validation
    validation = await nubra_client.validate_endpoints()
    
    # 3. Knowledge base stats
    sources = rag.get_knowledge_sources()
    pdf_count = sum(1 for s in sources if s["type"] == "PDF")
    url_count = sum(1 for s in sources if s["type"] == "URL")
    
    return {
        "yfinance": data_health,
        "providers": providers_stats,
        "nubra": {
            "authenticated": nubra_client.session_token is not None,
            "mock_mode": nubra_client.mock_mode,
            "phone": nubra_client.saved_phone,
            "device_id": nubra_client.device_id,
            "validation": validation
        },
        "knowledge_base": {
            "total_sources": len(sources),
            "total_chunks": len(rag.vector_store.documents),
            "pdf_count": pdf_count,
            "url_count": url_count
        }
    }

# 5. Portfolio & Trade Execution APIs
@app.get("/api/portfolio/stats")
async def get_portfolio_stats():
    # If in mock mode, return simulated holdings and funds with is_sandbox: true
    if nubra_client.mock_mode:
        funds_res = await nubra_client.get_funds()
        holdings_res = await nubra_client.get_holdings()
        positions_res = await nubra_client.get_positions()
        return {
            "status": "success",
            "is_sandbox": True,
            "funds": funds_res.get("port_funds_and_margin", {}),
            "holdings": holdings_res.get("portfolio", {}),
            "positions": positions_res.get("portfolio", {})
        }

    # If not authenticated and mock mode is off, return clear NOT_AUTHENTICATED error
    if not nubra_client.session_token and not nubra_client.mock_mode:
        return {
            "status": "error",
            "error_type": "NOT_AUTHENTICATED",
            "title": "Not Connected",
            "reason": "No active session with Nubra Broker API was found.",
            "action": "Please click the 'Sync Nubra API' button in the header to authenticate."
        }
        
    try:
        # Fetch funds, holdings, and positions in parallel
        funds_task = nubra_client.get_funds()
        holdings_task = nubra_client.get_holdings()
        positions_task = nubra_client.get_positions()
        
        funds_res, holdings_res, positions_res = await asyncio.gather(
            funds_task, holdings_task, positions_task
        )
        
        errors = []
        parsed_errors = {}
        for name, res in [("Funds", funds_res), ("Holdings", holdings_res), ("Positions", positions_res)]:
            if isinstance(res, dict) and "error" in res:
                err_msg = res["error"]
                error_type = "API_ERROR"
                title = f"Nubra {name} Fetch Failed"
                reason = res.get("message", "An unexpected network error occurred while reaching Nubra servers.")
                action = "Verify your internet connection or check if Nubra service is temporarily down, then retry."
                
                if "401" in err_msg or "unauthorized" in err_msg.lower() or "authentication" in err_msg.lower():
                    error_type = "INVALID_CREDENTIALS"
                    title = "Invalid Credentials"
                    reason = "Your Nubra session has expired or is unauthorized."
                    action = "Click 'Sync Nubra API' to log in again and refresh your session."
                elif "429" in err_msg or "rate limit" in err_msg.lower():
                    error_type = "RATE_LIMITED"
                    title = "Rate Limited"
                    reason = "Too many requests sent to Nubra API in a short period."
                    action = "Please wait a few seconds before trying again."
                elif "timeout" in err_msg.lower() or "time out" in err_msg.lower():
                    error_type = "API_TIMEOUT"
                    title = "API Timeout"
                    reason = "Nubra servers took too long to respond to the request."
                    action = "The UAT environment might be slow. Click Retry below to fetch again."
                    
                errors.append(f"{name}: {res['error']} - {reason}")
                parsed_errors[name.lower()] = {
                    "error_type": error_type,
                    "title": title,
                    "reason": reason,
                    "action": action
                }
                
        # If all 3 endpoints failed, return a complete error state
        if len(errors) == 3:
            return {
                "status": "error",
                **parsed_errors["funds"]
            }
            
        # If 1 or 2 failed, return a "partial" status
        status = "partial" if len(errors) > 0 else "success"
        
        return {
            "status": status,
            "is_sandbox": False,
            "partial_errors": parsed_errors,
            "funds": funds_res.get("port_funds_and_margin", {}) if "funds" not in parsed_errors else None,
            "holdings": holdings_res.get("portfolio", {}) if "holdings" not in parsed_errors else None,
            "positions": positions_res.get("portfolio", {}) if "positions" not in parsed_errors else None
        }
    except Exception as e:
        return {
            "status": "error",
            "error_type": "UNKNOWN_ERROR",
            "title": "Data Fetch Failed",
            "reason": str(e),
            "action": "Ensure the backend service is running and reach out to support if the issue persists."
        }

@app.get("/api/portfolio/performance")
async def get_portfolio_performance():
    """Calculate trading performance metrics and daily P&L from order history."""
    if not nubra_client.session_token and not nubra_client.mock_mode:
        return {
            "status": "error",
            "error_type": "NOT_AUTHENTICATED",
            "message": "Broker is not connected."
        }
    try:
        orders = await nubra_client.get_orders()
        
        # Filter for filled orders only
        filled = []
        for o in orders:
            status = o.get("order_status") or o.get("status") or ""
            if "FILLED" in status.upper() or "COMPLETE" in status.upper():
                filled.append(o)
                
        if not filled:
            return {
                "status": "success",
                "metrics": {"win_rate": 0.0, "total_trades": 0, "wins": 0, "losses": 0, "net_pnl": 0.0},
                "daily_pnl": []
            }
            
        # Group by symbol for FIFO trade matching
        by_symbol = {}
        for o in filled:
            sym = o.get("display_name") or o.get("symbol") or "UNKNOWN"
            by_symbol.setdefault(sym, []).append(o)
            
        trades = []
        for sym, sym_orders in by_symbol.items():
            try:
                sym_orders = sorted(sym_orders, key=lambda x: (x.get("timestamp", ""), int(x.get("order_id", 0))))
            except Exception:
                pass
                
            buys = []
            for o in sym_orders:
                side = o.get("order_side") or ""
                qty = o.get("order_qty") or 0
                price = o.get("order_price") or 0.0
                date_str = o.get("timestamp") or o.get("date") or ""
                if "T" in date_str:
                    date_str = date_str.split("T")[0]
                    
                if "BUY" in side.upper():
                    buys.append({"qty": qty, "price": price, "date": date_str})
                elif "SELL" in side.upper():
                    sell_qty = qty
                    realized_pnl = 0.0
                    while sell_qty > 0 and buys:
                        oldest = buys[0]
                        match_qty = min(sell_qty, oldest["qty"])
                        realized_pnl += (price - oldest["price"]) * match_qty
                        oldest["qty"] -= match_qty
                        sell_qty -= match_qty
                        if oldest["qty"] == 0:
                            buys.pop(0)
                    trades.append({"symbol": sym, "date": date_str, "pnl": round(realized_pnl, 2), "is_win": realized_pnl > 0})
                    
        # Group trades by date for daily P&L
        daily_map = {}
        for t in trades:
            dt = t["date"]
            if not dt:
                continue
            daily_map.setdefault(dt, {"pnl": 0.0, "trades_count": 0, "wins": 0, "losses": 0})
            daily_map[dt]["pnl"] += t["pnl"]
            daily_map[dt]["trades_count"] += 1
            if t["is_win"]:
                daily_map[dt]["wins"] += 1
            else:
                daily_map[dt]["losses"] += 1
                
        daily_pnl_list = [
            {"date": dt, "pnl": round(info["pnl"], 2), "trades_count": info["trades_count"],
             "status": "win" if info["pnl"] > 0 else "loss" if info["pnl"] < 0 else "neutral"}
            for dt, info in sorted(daily_map.items())
        ]
        
        total_trades = len(trades)
        wins = sum(1 for t in trades if t["is_win"])
        losses = total_trades - wins
        win_rate = round((wins / total_trades) * 100, 1) if total_trades > 0 else 0.0
        net_pnl = round(sum(t["pnl"] for t in trades), 2)
        
        return {
            "status": "success",
            "metrics": {"win_rate": win_rate, "total_trades": total_trades, "wins": wins, "losses": losses, "net_pnl": net_pnl},
            "daily_pnl": daily_pnl_list
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "metrics": {"win_rate": 0.0, "total_trades": 0, "wins": 0, "losses": 0, "net_pnl": 0.0},
            "daily_pnl": []
        }

@app.post("/api/trade/place")
async def place_trade(req: OrderRequest):
    res = await nubra_client.place_order(
        ref_id=req.ref_id,
        qty=req.qty,
        side=req.side,
        price=req.price,
        price_type=req.price_type,
        symbol=req.symbol
    )
    if not res.get("success", False):
        raise HTTPException(status_code=400, detail=res.get("message", "Order placement failed"))
    return res

@app.post("/api/trade/margin")
async def check_margin(req: MarginRequest):
    res = await nubra_client.get_margin_required(
        ref_id=req.ref_id,
        qty=req.qty,
        side=req.side,
        price=req.price
    )
    return res

@app.post("/api/strategy/backtest")
async def backtest_strategy(req: BacktestRequest):
    results = []
    for symbol in req.symbols[:12]:
        hist = await asyncio.to_thread(
            fetch_historical_candles,
            symbol,
            "NSE",
            "1d",
            req.period,
        )
        candles = hist.get("candles", [])
        backtest = run_breakout_backtest(
            candles,
            initial_capital=req.initial_capital,
            risk_per_trade_pct=req.risk_per_trade_pct,
            max_position_pct=req.max_position_pct,
            holding_days=req.holding_days,
        )
        results.append({
            "symbol": symbol.upper(),
            "provider": hist.get("provider", "None"),
            **backtest,
        })
    return {"results": results}

@app.post("/api/automation/plans")
async def get_automation_plans(req: AutomationRequest):
    return await build_current_trade_plans(req)

@app.post("/api/automation/run")
async def run_automation(req: AutomationRequest):
    plan_result = await build_current_trade_plans(req)
    ready_plans = [p for p in plan_result["plans"] if p["status"] == "ready"][: req.max_orders]
    execution_log = []

    if req.dry_run:
        return {
            **plan_result,
            "mode": "dry_run",
            "execution_log": [
                {"symbol": p["symbol"], "action": "would_place_limit_order", "plan": p}
                for p in ready_plans
            ],
        }

    if not req.allow_live:
        raise HTTPException(status_code=400, detail="Live automation requires allow_live=true.")
    if not plan_result["market_open"]:
        raise HTTPException(status_code=400, detail="Live automation is blocked outside regular NSE market hours.")
    if not nubra_client.session_token or nubra_client.mock_mode:
        raise HTTPException(status_code=400, detail="Live automation requires an authenticated non-mock Nubra session.")

    for plan in ready_plans:
        margin = await nubra_client.get_margin_required(
            ref_id=plan["ref_id"],
            qty=plan["qty"],
            side=plan["side"],
            price=plan["limit_price"],
        )
        required = float(margin.get("total_margin") or 0)
        if required > plan_result["available_cash"]:
            execution_log.append({"symbol": plan["symbol"], "status": "blocked", "reason": "Insufficient margin", "margin": margin})
            continue

        order = await nubra_client.place_order(
            ref_id=plan["ref_id"],
            qty=plan["qty"],
            side=plan["side"],
            price=plan["limit_price"],
            price_type="LIMIT",
            symbol=plan["symbol"],
        )
        execution_log.append({"symbol": plan["symbol"], "status": "submitted", "order": order})
        await asyncio.sleep(0.2)

    return {**plan_result, "mode": "live", "execution_log": execution_log}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)













