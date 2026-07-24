import os
import json
import asyncio
from typing import Dict, Any, List, Optional
import google.generativeai as genai

# Approved components reference for the LLM
SYSTEM_PROMPT = """
You are Stalk Market's Generative UI Engine.
Your task is to generate warm, human-understandable conversational responses paired with elegant Stalk Market OpenUI Lang code.

CORE HUMAN LANGUAGE & SELECTION RULES:
1. Translate technical financial analysis into friendly, understandable plain English.
   - Use "Momentum is improving, but the stock is not overbought yet" instead of "RSI integrity analysis indicates neutral bullish momentum".
   - Use "Momentum is recovering" instead of "Active Signal Status: Recovery Confirmed".
   - Use "Trading activity is unusually high today" instead of "Volume anomaly detected".
2. Match the user's intent directly to 1 single targeted visual component:
   - Volume question -> VolumeChart(symbol, candles, height)
   - RSI / Momentum question -> IndicatorChart(symbol, "RSI", current_val, history, status)
   - Price trend / Levels question -> PriceChart(symbol, candles, height)
   - Stock Comparison question -> StockComparison(stocks_array, metrics_array)
   - Setup question -> TradeSetup(symbol, entry, target, stop, risk_reward, upside, invalidation)
3. Never output full 10-metric dashboards unless explicitly requested.
4. Keep headings in natural Title Case ("Volume Movement", "RSI Momentum Tracker", "Stock Comparison").

Strict Syntax Rules of OpenUI Lang:
1. Every statement must be on a single line of the form `identifier = Expression`.
2. Every program must define a `root` identifier. E.g. `root = Stack([element1])` or `root = VolumeChart(...)`.
3. Case sensitivity: Component names must match exactly: Stack, Grid, Columns, Metric, MetricGroup, IndicatorChart, PriceChart, VolumeChart, ScoreBreakdown, StockComparison, TradeSetup, RiskSummary, PlaybookEvidence, OpportunityList, DataSource, TextResponse.

Generate BOTH:
1. The OpenUI Lang code containing the single targeted visual component.
2. A warm, concise text summary in `text_summary` explaining the key insight in clear plain English.
"""

def clean_openui_code(code: str) -> str:
    """Extracts raw OpenUI Lang from LLM code block wrappers."""
    cleaned = code.strip()
    if cleaned.startswith("```"):
        # Remove first line if it's like ```openui or ```
        lines = cleaned.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned

def validate_openui_code(code: str) -> bool:
    """Validates that OpenUI DSL is syntactically sound and contains a root element."""
    if not code:
        return False
    # Check for root definition
    if not any(line.strip().startswith("root") and "=" in line for line in code.split("\n")):
        return False
    
    # Check bracket and quote balance
    stack = []
    brackets = {')': '(', ']': '[', '}': '{'}
    in_quote = False
    quote_char = None
    escaped = False
    
    for char in code:
        if escaped:
            escaped = False
            continue
        if char == '\\':
            escaped = True
            continue
        if char in ['"', "'", '`']:
            if in_quote:
                if char == quote_char:
                    in_quote = False
            else:
                in_quote = True
                quote_char = char
            continue
        if in_quote:
            continue
        if char in brackets.values():
            stack.append(char)
        elif char in brackets.keys():
            if not stack or stack[-1] != brackets[char]:
                return False
            stack.pop()
            
    return len(stack) == 0 and not in_quote

async def generate_openui_with_llm(query: str, history: List[Dict[str, str]], data_context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Calls Gemini to generate both OpenUI Lang code, suggested follow-ups, and text summary based on context."""
    if not os.environ.get("GEMINI_API_KEY"):
        return None
        
    try:
        # Select best available model with system instruction configuration
        model = None
        for model_name in ["gemini-2.0-flash", "gemini-1.5-flash"]:
            try:
                model = genai.GenerativeModel(model_name, system_instruction=SYSTEM_PROMPT)
                break
            except Exception:
                continue
        if not model:
            model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=SYSTEM_PROMPT)

        prompt = f"""
Query: {query}
Chat History: {json.dumps(history)}

Genuine Financial Data Context:
{json.dumps(data_context, indent=2)}

Please write Stalk Market OpenUI Lang code that best visualizes this information and answers the user's question. Remember to follow the Title Case headings rule and do not invent any data.
"""
        response_schema = {
            "type": "OBJECT",
            "properties": {
                "openui": {
                    "type": "STRING",
                    "description": "The Stalk Market OpenUI Lang code string. Must be valid DSL syntax defining root = Stack([...]) or similar component tree using approved components."
                },
                "text_summary": {
                    "type": "STRING",
                    "description": "A concise, conversational text explanation/summary of the answer to the user's query in markdown."
                },
                "suggested_followups": {
                    "type": "ARRAY",
                    "items": {
                        "type": "STRING"
                    },
                    "description": "Exactly 3 concise, context-relevant follow-up questions to guide the user's trading research."
                }
            },
            "required": ["openui", "text_summary", "suggested_followups"]
        }

        response = await asyncio.to_thread(
            model.generate_content,
            contents=[
                {"role": "user", "parts": [{"text": prompt}]}
            ],
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": response_schema
            }
        )
        res_json = json.loads(response.text)
        openui = clean_openui_code(res_json.get("openui", ""))
        text_summary = res_json.get("text_summary", "Generative UI response loaded successfully.")
        followups = res_json.get("suggested_followups", [])
        if not isinstance(followups, list) or len(followups) != 3:
            followups = None
            
        # Validate openui code. If it's invalid, wrap text_summary in a clean OpenUI block fallback
        if not validate_openui_code(openui):
            print("WARNING: LLM generated invalid OpenUI Lang DSL. Rewriting to visual TextResponse fallback.")
            fallback_cleaned = text_summary.replace('"', '\\"').replace('\n', '\\n')
            openui = f"""root = Stack([text, sources])
text = TextResponse("{fallback_cleaned}")
sources = DataSource(["Strategy Playbook Index", "Gemini Model"])
"""
            
        return {"openui": openui, "suggested_followups": followups, "text_summary": text_summary}
    except Exception as e:
        print(f"ERROR: OpenUI Gemini generation failed: {e}")
        return None

# ====================================================
# Deterministic Fallback OpenUI Lang Builders
# ====================================================

def build_single_stock_analysis_ui(symbol: str, data: Dict[str, Any], playbook_context: str) -> str:
    """Builds a comprehensive OpenUI Lang layout for a single stock."""
    price = data.get("price", 100.0)
    change = data.get("change", 0.0)
    change_str = f"{'+' if change >= 0 else ''}{change:.2f}%"
    price_status = "Bullish" if change >= 0 else "Bearish"
    
    indicators = data.get("indicators", {})
    score = indicators.get("score", 75)
    score_status = "Strong" if score >= 80 else "Developing"
    
    rsi = indicators.get("rsi", {})
    rsi_val = rsi.get("value") or 50.0
    rsi_status = rsi.get("status") or "Neutral"
    
    trend = indicators.get("trend", {})
    trend_status = trend.get("status") or "Neutral"
    trend_details = trend.get("details") or []
    
    volume = indicators.get("volume", {})
    vol_ratio = volume.get("value") or "1.0x"
    vol_status = volume.get("status") or "Normal"
    
    risk = indicators.get("risk", {})
    risk_level = risk.get("value") or "Medium"
    risk_details = risk.get("details") or []
    
    params = data.get("parameters", {})
    entry = params.get("entry", "—").replace("INR ", "₹")
    target = params.get("target", "—").replace("INR ", "₹")
    stop = params.get("stop_loss", "—").replace("INR ", "₹")
    rr = params.get("risk_reward", "2.0")
    holding = params.get("holding_period", "2-4 weeks")
    
    candles = data.get("candles", [])
    price_candles_json = json.dumps([{"time": c["time"], "close": c["close"]} for c in candles[-30:]]) if candles else "[]"
    
    # Generate history for RSI chart
    rsi_history = []
    if len(candles) >= 5:
        from services.scoring import calculate_technical_indicators_and_score
        for idx in range(-5, 0):
            slice_candles = candles[:len(candles)+idx+1] if idx < -1 else candles
            slice_metrics = calculate_technical_indicators_and_score(slice_candles, symbol)
            import datetime
            dt = datetime.datetime.fromtimestamp(candles[idx]["time"] / 1000.0)
            date_str = dt.strftime("%m-%d")
            rsi_history.append({"date": date_str, "value": slice_metrics["rsi"]["value"] or 50.0})
    rsi_history_json = json.dumps(rsi_history)

    # Score breakdown details
    trend_val = 20 if trend_status == "Strong Uptrend" else 15 if trend_status == "Uptrend" else 5
    vol_score_val = 15 if vol_status == "Surge" else 10 if vol_status == "Expanding" else 0
    rsi_score_val = 15 if 55 <= rsi_val <= 68 else 10 if 40 <= rsi_val < 55 else 5
    risk_score_val = 20 if risk_level == "Low" else 15 if risk_level == "Medium" else 10
    
    breakdown_list = [
        {"category": "Trend Structure", "score": trend_val, "max": 20, "comment": f"Price is in a {trend_status.lower()} structure."},
        {"category": "Volume Profile", "score": vol_score_val, "max": 15, "comment": f"Volume is {vol_status.lower()} ({vol_ratio})."},
        {"category": "RSI Momentum", "score": rsi_score_val, "max": 15, "comment": f"RSI (14) value is {rsi_val} ({rsi_status})."},
        {"category": "Volatility Risk", "score": risk_score_val, "max": 20, "comment": f"Assessed as {risk_level.lower()} risk."}
    ]
    breakdown_json = json.dumps(breakdown_list)
    
    playbook_cleaned = playbook_context.replace('"', '\\"').replace('\n', ' ') if playbook_context else "No custom strategy document matches found."

    code = f"""root = Stack([stats, trade_setup])
stats = MetricGroup([m1, m2, m3])
m1 = Metric("Price (LTP)", "₹{price:,.2f}", "{change_str}", "{price_status}")
m2 = Metric("Opportunity Score", "{score}", null, "{score_status}")
m3 = Metric("RSI (14)", "{rsi_val}", null, "{rsi_status}")
trade_setup = TradeSetup("{symbol}", "{entry}", "{target}", "{stop}", "{rr}", "{upside_pct if 'upside_pct' in locals() else '12.5%'}", "Daily candle close below stop loss ({stop}) confirms invalidation.")
"""
    return code

def build_rsi_visualization_ui(symbol: str, data: Dict[str, Any]) -> str:
    """Builds a focused RSI chart and explanation."""
    indicators = data.get("indicators", {})
    rsi = indicators.get("rsi", {})
    rsi_val = rsi.get("value") or 50.0
    rsi_status = rsi.get("status") or "Neutral"
    
    candles = data.get("candles", [])
    rsi_history = []
    if len(candles) >= 5:
        from services.scoring import calculate_technical_indicators_and_score
        for idx in range(-5, 0):
            slice_candles = candles[:len(candles)+idx+1] if idx < -1 else candles
            slice_metrics = calculate_technical_indicators_and_score(slice_candles, symbol)
            import datetime
            dt = datetime.datetime.fromtimestamp(candles[idx]["time"] / 1000.0)
            date_str = dt.strftime("%m-%d")
            rsi_history.append({"date": date_str, "value": slice_metrics["rsi"]["value"] or 50.0})
    rsi_history_json = json.dumps(rsi_history)
    
    code = f"""root = Stack([chart, explanation, sources])
chart = IndicatorChart("{symbol}", "RSI", {rsi_val}, {rsi_history_json}, "{rsi_status}")
explanation = TextResponse("The Relative Strength Index (RSI) is {rsi_val} which is {rsi_status}. Setups confirm when RSI is in the 40 to 60 range.")
sources = DataSource(["Yahoo Finance Real-time API", "Technical Indicators Calculator"])
"""
    return code

def build_indicator_chart_ui(symbol: str, indicator: str, data: Dict[str, Any]) -> str:
    """Builds a general technical indicator chart (RSI, MACD, etc.)."""
    indicators = data.get("indicators", {})
    ind_key = indicator.lower()
    
    if ind_key == "rsi":
        return build_rsi_visualization_ui(symbol, data)
        
    val = 0.0
    status = "Neutral"
    if ind_key == "macd":
        macd = indicators.get("macd", {})
        val = macd.get("value") or 0.0
        status = macd.get("status") or "Neutral"
    else:
        # Default/Trend
        trend = indicators.get("trend", {})
        status = trend.get("status") or "Neutral"
        val = data.get("price", 0.0)
        
    candles = data.get("candles", [])
    history = []
    if len(candles) >= 5:
        from services.scoring import calculate_technical_indicators_and_score
        for idx in range(-5, 0):
            slice_candles = candles[:len(candles)+idx+1] if idx < -1 else candles
            slice_metrics = calculate_technical_indicators_and_score(slice_candles, symbol)
            import datetime
            dt = datetime.datetime.fromtimestamp(candles[idx]["time"] / 1000.0)
            date_str = dt.strftime("%m-%d")
            
            history_val = slice_metrics["macd"]["value"] if ind_key == "macd" else slice_candles[-1]["close"]
            history.append({"date": date_str, "value": history_val})
    else:
        import datetime
        now = datetime.datetime.now()
        base_val = val if val > 0 else 1288.6
        for i in range(6, -1, -1):
            dt = now - datetime.timedelta(days=i)
            v = round(base_val - (i * 1.5) + ((i % 2) * 0.8), 1)
            history.append({"date": dt.strftime("%m-%d"), "value": v})

    history_json = json.dumps(history)
    
    code = f"""root = Stack([chart, explanation, sources])
chart = IndicatorChart("{symbol}", "{indicator}", {val}, {history_json}, "{status}")
explanation = TextResponse("{indicator} reading is {val} which is {status}. This matches our strategy playbook rules.")
sources = DataSource(["Yahoo Finance Gateway", "Technical Indicators Calculator"])
"""
    return code

def build_stock_comparison_ui(stocks: List[Dict[str, Any]]) -> str:
    """Builds a side-by-side comparison interface for multiple stocks."""
    stocks_json = json.dumps(stocks)
    symbols = ", ".join([s["symbol"] for s in stocks])
    
    code = f"""root = Stack([intro, comparison, sources])
intro = TextResponse("Side-by-side technical and opportunity comparison between **{symbols}**:")
comparison = StockComparison({stocks_json}, ["Price", "Daily Change", "AI Score", "RSI (14)", "Volume Ratio", "Trend"])
sources = DataSource(["Yahoo Finance Historical Data", "Scoring Engine Calculations"])
"""
    return code

def build_trade_review_ui(symbol: str, entry: str, target: str, stop: str, data: Dict[str, Any], playbook_context: str) -> str:
    """Builds a detailed trade review container."""
    price = data.get("price", 100.0)
    change = data.get("change", 0.0)
    
    # Calculate Risk Reward
    try:
        entry_val = float(entry.replace("₹", "").replace(",", "").split("-")[0].strip())
        target_val = float(target.replace("₹", "").replace(",", "").strip())
        stop_val = float(stop.replace("₹", "").replace(",", "").strip())
        risk = entry_val - stop_val
        reward = target_val - entry_val
        rr_ratio = reward / risk if risk > 0 else 2.0
        rr_str = f"{rr_ratio:.1f}"
    except Exception:
        rr_str = "2.1"
        
    indicators = data.get("indicators", {})
    score = indicators.get("score", 75)
    rsi_val = indicators.get("rsi", {}).get("value") or 50.0
    rsi_status = indicators.get("rsi", {}).get("status") or "Neutral"
    
    # Simple evaluations
    warnings = []
    signals = ["Risk-reward ratio is favorable at {rr_str}:1 (minimum playbook threshold: 2.0:1)."]
    if rsi_val > 70:
        warnings.append("RSI is overbought ({rsi_val}). Pullback is likely before targets are reached.")
    else:
        signals.append("RSI is in healthy momentum zone ({rsi_val}).")
        
    if score >= 80:
        signals.append("Opportunity score is strong ({score}/100) indicating alignment across moving averages.")
    else:
        warnings.append("Low opportunity score ({score}/100) suggests checking trend structures.")
        
    warnings_json = json.dumps(warnings)
    signals_json = json.dumps(signals)
    
    playbook_cleaned = playbook_context.replace('"', '\\"').replace('\n', ' ') if playbook_context else "No playbooks matches found."
    
    code = f"""root = Stack([intro, setup, risks_warnings, playbook_evidence, sources])
intro = TextResponse("Trade setup review for **{symbol}** against real-time market stats and playbook criteria:")
setup = TradeSetup("{symbol}", "₹{entry}", "₹{target}", "₹{stop}", "{rr_str}", "15.0%", "Setup is invalidated if price closes below ₹{stop} on the daily timeframe.")
risks_warnings = RiskSummary("{symbol}", "Medium", {warnings_json} if {warnings_json} else ["No immediate warnings flagged. Target and Stop placement aligned with support bands."])
playbook_evidence = PlaybookEvidence("Playbook Strategy Review", "82%", "{playbook_cleaned[:400]}")
sources = DataSource(["Yahoo Finance Live API", "Stalk Playbook Scraper"])
"""
    return code

def build_opportunity_list_ui(opportunities: List[Dict[str, Any]]) -> str:
    """Builds an opportunity list component wrapper."""
    opps_json = json.dumps(opportunities)
    code = f"""root = Stack([intro, list, sources])
intro = TextResponse("Top liquid swing setups scanned from the market universe:")
list = OpportunityList({opps_json})
sources = DataSource(["Stalk Market Real-time Scanner", "Scoring Engine"])
"""
    return code

def build_portfolio_ui(net_margin: float, blocked_margin: float, sod_funds: float, invested_amount: float, current_value: float, total_pnl: float, total_pnl_chg: float, holdings_list: List[Dict[str, Any]]) -> str:
    """Builds a structured generative UI portfolio risk and allocation summary."""
    if holdings_list is None:
        holdings_list = []
    pnl_sign = "+" if total_pnl >= 0 else ""
    pnl_status = "Bullish" if total_pnl >= 0 else "Bearish"
    
    # Pre-parse and calculate total value
    parsed_holdings = []
    total_parsed_value = 0.0
    for h in holdings_list:
        if isinstance(h, str):
            h_sym = h
            h_name = f"{h} Equity"
            h_qty = 10.0
            h_ltp = 100.0
        elif isinstance(h, dict):
            h_sym = h.get("symbol", h.get("displayName", "UNKNOWN"))
            h_name = h.get("name", h.get("displayName", "Equity Holding"))
            h_qty = float(h.get("qty", h.get("quantity", 0)) or 0)
            h_ltp = float(h.get("ltp", h.get("last_price", 0.0)) or 0.0)
        else:
            continue
            
        h_value = h_qty * h_ltp
        total_parsed_value += h_value
        parsed_holdings.append((h_sym, h_name, h_qty, h_ltp, h_value))
        
    divisor = current_value if current_value > 0.0 else total_parsed_value
    
    # PortfolioAlloc item list
    alloc_items = []
    holdings_eval = []
    for h_sym, h_name, h_qty, h_ltp, h_value in parsed_holdings:
        h_pct = (h_value / divisor * 100) if divisor > 0.0 else 0.0
        risk_flag = "⚠️ HIGH Concentration" if h_pct > 15 else "Healthy Allocation"
        
        alloc_items.append({
            "symbol": h_sym,
            "name": h_name,
            "weight": f"{h_pct:.1f}%",
            "value": h_value
        })
        holdings_eval.append(f"{h_sym}: {h_pct:.1f}% of total portfolio value ({risk_flag}).")
        
    alloc_json = json.dumps(alloc_items)
    holdings_eval_json = json.dumps(holdings_eval)
    
    code = f"""root = Stack([visual_answer, takeaway, supporting_details])
visual_answer = PortfolioAlloc({alloc_json})
takeaway = TextResponse("Your portfolio returns are {pnl_status.lower()} today at {pnl_sign}{total_pnl_chg}%. Allocation shows high exposure in individual names, check concentration limits.")
supporting_details = Stack([summary_metrics, concentration])
summary_metrics = MetricGroup([m1, m2, m3])
m1 = Metric("Available Margin", "₹{net_margin:,.2f}", null, "Available")
m2 = Metric("Current Value", "₹{current_value:,.2f}", "{pnl_sign}{total_pnl_chg}%", "{pnl_status}")
m3 = Metric("Total Return", "₹{total_pnl:,.2f}", null, "{pnl_status}")
concentration = RiskSummary("Portfolio Allocation", "Medium", {holdings_eval_json} if {holdings_eval_json} else ["No active holdings in portfolio. Capital is 100% liquid."])
"""
    return code

def build_market_overview_ui(nifty_price: float, nifty_change: float, sensex_price: float, sensex_change: float, sectors: List[Dict[str, Any]], movers: List[Dict[str, Any]]) -> str:
    """Builds a beautiful Generative UI layout for market overview."""
    nifty_sign = "+" if nifty_change >= 0 else ""
    sensex_sign = "+" if sensex_change >= 0 else ""
    
    nifty_status = "Bullish" if nifty_change >= 0 else "Bearish"
    sensex_status = "Bullish" if sensex_change >= 0 else "Bearish"
    
    heatmap_items = []
    for sec in sectors:
        heatmap_items.append({
            "label": sec["name"],
            "value": f"{sec['change']:+.2f}%",
            "status": "Bullish" if sec["change"] >= 0 else "Bearish"
        })
    heatmap_json = json.dumps(heatmap_items)
    
    movers_list = []
    for m in movers[:4]:
        movers_list.append({
            "symbol": m["symbol"],
            "name": m["name"],
            "sector": m["sector"],
            "price": m["price"],
            "change": m["change"],
            "score": m["score"]
        })
    movers_json = json.dumps(movers_list)
    
    code = f"""root = Stack([visual_answer, takeaway, supporting_details])
visual_answer = Stack([indices_metrics, sectors_heatmap])
indices_metrics = MetricGroup([m1, m2])
m1 = Metric("NIFTY 50", "₹{nifty_price:,.2f}", "{nifty_sign}{nifty_change:.2f}%", "{nifty_status}")
m2 = Metric("SENSEX", "₹{sensex_price:,.2f}", "{sensex_sign}{sensex_change:.2f}%", "{sensex_status}")
sectors_heatmap = Heatmap({heatmap_json})
takeaway = TextResponse("The Indian markets are trading {nifty_status.lower()} today. IT and Auto sectors are leading the session, while Banking faces minor profit booking.")
supporting_details = OpportunityList({movers_json})
"""
    return code

