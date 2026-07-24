import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from services.yahoo_finance import fetch_historical_candles, fetch_live_price

print("--- TESTING LIVE PRICE ---")
for sym in ["NIFTY", "SENSEX", "RELIANCE", "HFCL", "KPITTECH", "JBM AUTO", "BLS INTL"]:
    res = fetch_live_price(sym)
    print(f"{sym}: success={res.get('success')}, price={res.get('price')}, change={res.get('change')}, provider={res.get('provider')}")

print("\n--- TESTING HISTORICAL CANDLES (1d, 3mo) ---")
for sym in ["NIFTY", "SENSEX", "RELIANCE", "HFCL", "KPITTECH", "JBM AUTO", "BLS INTL"]:
    res = fetch_historical_candles(sym, period="3mo", interval="1d")
    print(f"{sym}: success={res.get('success')}, candles_count={len(res.get('candles', []))}, provider={res.get('provider')}")

print("\n--- TESTING HISTORICAL CANDLES (1h, 5d) ---")
for sym in ["NIFTY", "SENSEX"]:
    res = fetch_historical_candles(sym, period="5d", interval="1h")
    print(f"{sym}: success={res.get('success')}, candles_count={len(res.get('candles', []))}, provider={res.get('provider')}")
