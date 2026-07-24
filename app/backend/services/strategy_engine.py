from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from services.scoring import calculate_technical_indicators_and_score


IST = timezone(timedelta(hours=5, minutes=30))


def is_market_open_now() -> bool:
    now = datetime.now(timezone.utc).astimezone(IST)
    market_open = now.replace(hour=9, minute=15, second=0, microsecond=0)
    market_close = now.replace(hour=15, minute=30, second=0, microsecond=0)
    return now.weekday() < 5 and market_open <= now <= market_close


def _sma(values: List[float], window: int) -> Optional[float]:
    if len(values) < window:
        return None
    return sum(values[-window:]) / window


def _r_multiple(entry: float, exit_price: float, stop: float) -> float:
    risk = max(entry - stop, 0.01)
    return (exit_price - entry) / risk


def run_breakout_backtest(
    candles: List[Dict[str, Any]],
    initial_capital: float = 100000.0,
    risk_per_trade_pct: float = 0.5,
    max_position_pct: float = 10.0,
    holding_days: int = 8,
) -> Dict[str, Any]:
    """
    Conservative long-only NSE equity backtest:
    enter on price above SMA20/SMA50, RSI-style score >= 70, and volume expansion.
    Exit on stop, target, or max holding period.
    """
    if len(candles) < 60:
        return {
            "trades": [],
            "summary": {
                "trade_count": 0,
                "win_rate": 0,
                "net_pnl": 0,
                "net_return_pct": 0,
                "max_drawdown_pct": 0,
                "expectancy_r": 0,
            },
            "notes": ["Need at least 60 daily candles for this backtest."],
        }

    capital = initial_capital
    equity_high = initial_capital
    max_drawdown = 0.0
    trades: List[Dict[str, Any]] = []
    idx = 50

    while idx < len(candles) - 2:
        window = candles[: idx + 1]
        closes = [float(c["close"]) for c in window]
        volumes = [float(c.get("volume", 0)) for c in window]
        last = window[-1]
        close = float(last["close"])
        sma20 = _sma(closes, 20)
        sma50 = _sma(closes, 50)
        avg_volume_20 = sum(volumes[-20:]) / 20 if len(volumes) >= 20 else 0
        volume_ratio = float(last.get("volume", 0)) / avg_volume_20 if avg_volume_20 else 0
        score = calculate_technical_indicators_and_score(window, "BACKTEST")["score"]

        setup_ok = bool(sma20 and sma50 and close > sma20 > sma50 and volume_ratio >= 1.15 and score >= 70)
        if not setup_ok:
            idx += 1
            continue

        entry = float(candles[idx + 1]["open"])
        recent_lows = [float(c["low"]) for c in candles[max(0, idx - 9) : idx + 1]]
        stop = min(recent_lows) * 0.995
        target = entry + (entry - stop) * 2.0
        risk_per_share = max(entry - stop, 0.01)
        risk_budget = capital * (risk_per_trade_pct / 100)
        max_position_value = capital * (max_position_pct / 100)
        qty = int(min(risk_budget / risk_per_share, max_position_value / entry))

        if qty <= 0:
            idx += 1
            continue

        exit_price = float(candles[min(idx + holding_days, len(candles) - 1)]["close"])
        exit_reason = "time_exit"
        exit_idx = min(idx + holding_days, len(candles) - 1)

        for probe_idx in range(idx + 1, min(idx + holding_days + 1, len(candles))):
            probe = candles[probe_idx]
            if float(probe["low"]) <= stop:
                exit_price = stop
                exit_reason = "stop"
                exit_idx = probe_idx
                break
            if float(probe["high"]) >= target:
                exit_price = target
                exit_reason = "target"
                exit_idx = probe_idx
                break

        pnl = (exit_price - entry) * qty
        capital += pnl
        equity_high = max(equity_high, capital)
        drawdown = ((equity_high - capital) / equity_high) * 100 if equity_high else 0
        max_drawdown = max(max_drawdown, drawdown)

        trades.append({
            "entry_time": candles[idx + 1].get("time"),
            "exit_time": candles[exit_idx].get("time"),
            "entry": round(entry, 2),
            "exit": round(exit_price, 2),
            "stop": round(stop, 2),
            "target": round(target, 2),
            "qty": qty,
            "pnl": round(pnl, 2),
            "r_multiple": round(_r_multiple(entry, exit_price, stop), 2),
            "reason": exit_reason,
            "score": score,
        })
        idx = exit_idx + 1

    wins = [t for t in trades if t["pnl"] > 0]
    r_values = [float(t["r_multiple"]) for t in trades]
    net_pnl = capital - initial_capital

    return {
        "trades": trades[-25:],
        "summary": {
            "trade_count": len(trades),
            "win_rate": round((len(wins) / len(trades)) * 100, 1) if trades else 0,
            "net_pnl": round(net_pnl, 2),
            "net_return_pct": round((net_pnl / initial_capital) * 100, 2) if initial_capital else 0,
            "max_drawdown_pct": round(max_drawdown, 2),
            "expectancy_r": round(sum(r_values) / len(r_values), 2) if r_values else 0,
        },
        "notes": [
            "Long-only backtest using daily candles; brokerage, slippage, and taxes are not yet included.",
            "Use this as a filter, not proof of live profitability.",
        ],
    }


def build_trade_plan(
    opportunity: Dict[str, Any],
    available_cash: float,
    max_position_pct: float = 5.0,
    risk_per_trade_pct: float = 0.5,
    min_score: int = 75,
) -> Dict[str, Any]:
    price = float(opportunity.get("price") or 0)
    score = int(opportunity.get("score") or 0)
    symbol = opportunity.get("symbol", "UNKNOWN")
    ref_id = opportunity.get("ref_id")
    warnings: List[str] = []

    if not ref_id:
        warnings.append("Missing Nubra ref_id; resolve instrument before execution.")
    if price <= 0:
        warnings.append("No live price available.")
    if score < min_score:
        warnings.append(f"Score below configured minimum ({score} < {min_score}).")

    max_position_value = available_cash * (max_position_pct / 100)
    entry = round(price * 0.998, 2) if price > 0 else 0
    stop = round(price * 0.975, 2) if price > 0 else 0
    target = round(price * 1.045, 2) if price > 0 else 0
    per_share_risk = max(entry - stop, 0.01)
    risk_budget = available_cash * (risk_per_trade_pct / 100)
    qty = int(min(max_position_value / entry, risk_budget / per_share_risk)) if entry > 0 else 0

    if qty <= 0:
        warnings.append("Position size resolved to zero under current risk limits.")

    return {
        "symbol": symbol,
        "ref_id": ref_id,
        "score": score,
        "side": "BUY",
        "qty": qty,
        "price_type": "LIMIT",
        "limit_price": entry,
        "stop": stop,
        "target": target,
        "position_value": round(qty * entry, 2),
        "risk_amount": round(qty * per_share_risk, 2),
        "status": "blocked" if warnings else "ready",
        "warnings": warnings,
        "rationale": opportunity.get("signal_tags", []),
    }
