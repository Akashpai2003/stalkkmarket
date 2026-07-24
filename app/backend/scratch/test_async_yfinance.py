import asyncio
import sys
import os

# Add parent dir to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.yahoo_finance import fetch_live_price, fetch_historical_candles

async def main():
    print("Testing fetch_live_price for RELIANCE...")
    res = await fetch_live_price("RELIANCE")
    print("Result:", res)
    
    print("\nTesting fetch_historical_candles for HFCL...")
    res2 = await fetch_historical_candles("HFCL", period="3mo", interval="1d")
    print("Success:", res2.get("success"))
    print("Candles Count:", len(res2.get("candles", [])))
    print("Provider:", res2.get("provider"))

if __name__ == "__main__":
    asyncio.run(main())
