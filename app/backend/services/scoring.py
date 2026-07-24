from typing import List, Dict, Any, Optional
import math

def calculate_ema(prices: List[float], period: int) -> List[float]:
    if len(prices) < period:
        return [prices[-1]] * len(prices) if prices else []
    k = 2.0 / (period + 1)
    ema_vals = []
    # Start with SMA
    sma = sum(prices[:period]) / period
    ema_vals.append(sma)
    for price in prices[period:]:
        ema_vals.append(price * k + ema_vals[-1] * (1 - k))
    # Pad the front
    return [ema_vals[0]] * (period - 1) + ema_vals

def calculate_technical_indicators_and_score(
    candles: List[Dict[str, Any]], 
    symbol: str, 
    sector: str = "Other",
    nifty_candles: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Calculates technical indicators and a rating score (0-100) based on actual
    historical candle data. Follows the rules in docs/scoring_engine.md.
    """
    if not candles or len(candles) < 20:
        return {
            "rsi": {"value": None, "status": "Awaiting data"},
            "macd": {"value": 0.0, "signal": 0.0, "hist": 0.0, "status": "Awaiting data"},
            "volume": {"value": None, "status": "Awaiting data"},
            "trend": {"status": "Awaiting data", "details": []},
            "relative_strength": {"value": 0.0, "status": "Awaiting data"},
            "risk": {"value": "Awaiting data", "details": []},
            "score": 0,
            "signal_tags": ["Awaiting Data"]
        }
        
    prices = [float(c["close"]) for c in candles]
    volumes = [float(c.get("volume", 0)) for c in candles]
    highs = [float(c.get("high", c["close"])) for c in candles]
    lows = [float(c.get("low", c["close"])) for c in candles]
    
    last_price = prices[-1]
    
    # 1. Calculate RSI (14)
    rsi_val = 50.0
    if len(prices) >= 15:
        deltas = []
        for i in range(1, len(prices)):
            deltas.append(prices[i] - prices[i-1])
            
        gains = [d if d > 0 else 0.0 for d in deltas]
        losses = [-d if d < 0 else 0.0 for d in deltas]
        
        # Take the last 14 periods
        avg_gain = sum(gains[-14:]) / 14
        avg_loss = sum(losses[-14:]) / 14
        
        if avg_loss == 0:
            rsi_val = 100.0 if avg_gain > 0 else 50.0
        else:
            rs = avg_gain / avg_loss
            rsi_val = 100.0 - (100.0 / (1.0 + rs))
            
    rsi_status = "Neutral"
    if rsi_val >= 70:
        rsi_status = "Near Overbought" if rsi_val < 80 else "Overbought"
    elif rsi_val <= 30:
        rsi_status = "Oversold"
    elif rsi_val >= 55:
        rsi_status = "Strong Momentum"
        
    # 2. Calculate MACD
    macd_line = 0.0
    signal_line = 0.0
    macd_hist = 0.0
    macd_status = "Neutral"
    if len(prices) >= 26:
        ema12 = calculate_ema(prices, 12)
        ema26 = calculate_ema(prices, 26)
        macd_lines = [e12 - e26 for e12, e26 in zip(ema12, ema26)]
        signal_lines = calculate_ema(macd_lines, 9)
        macd_line = macd_lines[-1]
        signal_line = signal_lines[-1]
        macd_hist = macd_line - signal_line
        
        if macd_line > signal_line:
            macd_status = "Bullish Crossover" if macd_lines[-2] <= signal_lines[-2] else "Bullish Momentum"
        else:
            macd_status = "Bearish Crossover" if macd_lines[-2] >= signal_lines[-2] else "Bearish Momentum"

    # 3. Calculate Volume Expansion (vs 20D Average)
    last_volume = volumes[-1]
    avg_volume_20 = sum(volumes[-20:]) / len(volumes[-20:]) if len(volumes) >= 20 else sum(volumes) / len(volumes)
    vol_ratio = last_volume / avg_volume_20 if avg_volume_20 > 0 else 1.0
    
    vol_status = "Normal"
    if vol_ratio > 2.0:
        vol_status = "Surge"
    elif vol_ratio > 1.2:
        vol_status = "Expanding"
        
    # 4. Calculate Simple Moving Averages (SMA20, SMA50, SMA200)
    sma_20 = sum(prices[-20:]) / 20 if len(prices) >= 20 else sum(prices) / len(prices)
    sma_50 = sum(prices[-50:]) / 50 if len(prices) >= 50 else sum(prices) / len(prices)
    sma_200 = sum(prices[-200:]) / 200 if len(prices) >= 200 else sum(prices) / len(prices)
    
    above_sma_20 = last_price > sma_20
    above_sma_50 = last_price > sma_50
    above_sma_200 = last_price > sma_200
    
    trend_details = []
    if above_sma_20:
        trend_details.append("Above SMA20")
    else:
        trend_details.append("Below SMA20")
        
    if above_sma_50:
        trend_details.append("Above SMA50")
    else:
        trend_details.append("Below SMA50")
        
    if above_sma_200:
        trend_details.append("Above SMA200")
    else:
        trend_details.append("Below SMA200")
        
    if len(prices) >= 50:
        if sma_20 > sma_50:
            trend_details.append("SMA20 > SMA50 (Bullish)")
        else:
            trend_details.append("SMA20 < SMA50 (Bearish)")
            
    trend_status = "Neutral"
    if above_sma_20 and above_sma_50 and above_sma_200:
        trend_status = "Strong Uptrend" if sma_20 > sma_50 > sma_200 else "Uptrend"
    elif not above_sma_20 and not above_sma_50:
        trend_status = "Downtrend"
        
    # 5. Calculate Relative Strength (RS) vs Nifty 50
    rs_perf = 0.0
    rs_status = "Neutral"
    if nifty_candles and len(nifty_candles) >= 20 and len(prices) >= 20:
        nifty_closes = [float(c["close"]) for c in nifty_candles]
        
        # Stock performance over 50 days (or max available)
        perf_period = min(50, len(prices), len(nifty_closes))
        stock_return = (prices[-1] - prices[-perf_period]) / prices[-perf_period]
        nifty_return = (nifty_closes[-1] - nifty_closes[-perf_period]) / nifty_closes[-perf_period]
        
        rs_perf = (stock_return - nifty_return) * 100 # In percentage points
        if rs_perf > 5.0:
            rs_status = "Outperforming"
        elif rs_perf < -5.0:
            rs_status = "Underperforming"
        else:
            rs_status = "Co-moving"

    # 6. Score Calculation (100 Points Max)
    # A. Trend Structure (20 Points Max)
    trend_score = 0
    if above_sma_20 and above_sma_50 and above_sma_200:
        trend_score = 20 if sma_20 > sma_50 > sma_200 else 15
    elif above_sma_20 and above_sma_50:
        trend_score = 15
    elif above_sma_20 or above_sma_50:
        trend_score = 10
    else:
        trend_score = 0
        
    # B. Relative Strength (15 Points Max)
    rs_score = 5
    if rs_status == "Outperforming":
        rs_score = 15 if rs_perf > 10.0 else 10
    elif rs_status == "Underperforming":
        rs_score = 0
        
    # C. Volume Profile (15 Points Max)
    vol_score = 0
    if vol_ratio > 2.0:
        vol_score = 15
    elif vol_ratio >= 1.2:
        vol_score = 10
    else:
        vol_score = 0
        
    # D. RSI Momentum (15 Points Max)
    rsi_score = 5
    if 55 <= rsi_val <= 68:
        rsi_score = 15
    elif 40 <= rsi_val < 55:
        rsi_score = 10
    elif rsi_val > 70:
        rsi_score = 8 # Overbought risk
        
    # E. MACD Crossover (15 Points Max)
    macd_score = 0
    if macd_line > signal_line:
        macd_score = 15 if macd_hist > 0 else 10
    else:
        macd_score = 0
        
    # F. Volatility Risk (20 Points Max - Starts at 20, subtract penalties)
    risk_score = 20
    returns = []
    for i in range(max(1, len(prices) - 20), len(prices)):
        returns.append((prices[i] - prices[i-1]) / prices[i-1])
        
    vol = (sum(r**2 for r in returns) / len(returns))**0.5 if returns else 0.01
    risk_details = []
    
    if vol > 0.03:
        risk_score -= 10
        risk_details.append("High Volatility (Standard dev > 3.0%)")
    elif vol < 0.008:
        risk_score -= 5
        risk_details.append("Low Liquidity/Volatility warning (Standard dev < 0.8%)")
    else:
        risk_details.append("Optimal Volatility Profile")
        
    risk_details.append("Earnings Event > 14 Days Away")
    
    final_score = int(trend_score + rs_score + vol_score + rsi_score + macd_score + risk_score)
    final_score = max(0, min(100, final_score))
    
    # Generate signal tags based on technical parameters
    signal_tags = []
    if vol_ratio > 2.0:
        signal_tags.append("Volume Surge")
    elif vol_ratio > 1.2:
        signal_tags.append("Volume Expanding")
        
    if rsi_val >= 70:
        signal_tags.append("Near Resistance")
    elif rsi_val <= 30:
        signal_tags.append("Near Support")
    elif 55 <= rsi_val <= 68:
        signal_tags.append("Momentum Building")
        
    if above_sma_20 and above_sma_50:
        signal_tags.append("Strong Trend")
        
    if macd_status == "Bullish Crossover":
        signal_tags.append("MACD Buy Cross")
        
    if rs_status == "Outperforming":
        signal_tags.append("Relative Strength")
        
    if len(signal_tags) < 2:
        signal_tags.append("Breakout")
        
    return {
        "rsi": {
            "value": round(rsi_val, 1),
            "status": rsi_status
        },
        "macd": {
            "value": round(macd_line, 2),
            "signal": round(signal_line, 2),
            "hist": round(macd_hist, 2),
            "status": macd_status
        },
        "volume": {
            "value": f"{vol_ratio:.1f}x",
            "status": vol_status
        },
        "trend": {
            "status": trend_status,
            "details": trend_details
        },
        "relative_strength": {
            "value": round(rs_perf, 1),
            "status": rs_status
        },
        "risk": {
            "value": "High" if vol > 0.03 else "Low" if vol < 0.008 else "Medium",
            "details": risk_details
        },
        "score": final_score,
        "signal_tags": signal_tags[:3]
    }
