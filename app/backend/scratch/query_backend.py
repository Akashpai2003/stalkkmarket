import asyncio
import httpx

async def main():
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Auth Status
        try:
            r = await client.get("http://127.0.0.1:8000/api/auth/status")
            print("Auth Status:")
            print(r.json())
        except Exception as e:
            print(f"Auth Status Error: {e}")
            
        # 2. Settings Stats
        try:
            r = await client.get("http://127.0.0.1:8000/api/settings/stats")
            print("\nSettings Stats:")
            stats = r.json()
            # print only key parts
            print(f"yfinance: {stats.get('yfinance')}")
            print(f"nubra validation: {stats.get('nubra', {}).get('validation')}")
            print(f"nubra authenticated: {stats.get('nubra', {}).get('authenticated')}")
            print(f"nubra mock mode: {stats.get('nubra', {}).get('mock_mode')}")
        except Exception as e:
            print(f"Settings Stats Error: {e}")

        # 3. Portfolio Stats
        try:
            r = await client.get("http://127.0.0.1:8000/api/portfolio/stats")
            print("\nPortfolio Stats:")
            print(r.json())
        except Exception as e:
            print(f"Portfolio Stats Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
