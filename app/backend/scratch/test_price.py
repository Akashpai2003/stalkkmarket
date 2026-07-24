import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.yahoo_finance import fetch_live_price, fetch_historical_candles

async def main():
    print("=== Testing fetch_live_price('NIFTY') ===")
    result = await fetch_live_price("NIFTY")
    print(f"  Price: {result.get('price')}")
    print(f"  Change: {result.get('change')}")
    print(f"  Success: {result.get('success')}")
    print(f"  Provider: {result.get('provider')}")
    print()
    
    print("=== Testing fetch_live_price('SENSEX') ===")
    result = await fetch_live_price("SENSEX")
    print(f"  Price: {result.get('price')}")
    print(f"  Change: {result.get('change')}")
    print(f"  Success: {result.get('success')}")
    print(f"  Provider: {result.get('provider')}")
    print()
    
    print("=== Testing fetch_live_price('RELIANCE') ===")
    result = await fetch_live_price("RELIANCE")
    print(f"  Price: {result.get('price')}")
    print(f"  Change: {result.get('change')}")
    print(f"  Success: {result.get('success')}")
    print(f"  Provider: {result.get('provider')}")
    print()
    
    print("=== Testing fetch_historical_candles('NIFTY', period='5d', interval='1h') ===")
    result = await fetch_historical_candles("NIFTY", period="5d", interval="1h")
    print(f"  Success: {result.get('success')}")
    print(f"  Provider: {result.get('provider')}")
    print(f"  Candle count: {len(result.get('candles', []))}")
    if result.get('candles'):
        print(f"  Last candle: {result['candles'][-1]}")

asyncio.run(main())
