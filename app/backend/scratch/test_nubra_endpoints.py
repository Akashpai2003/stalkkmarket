import asyncio
import httpx
import json
import os

SESSION_FILE = r"C:\Users\akash\Stock trading AI Analysis\app\backend\db\nubra_session.json"

async def test_endpoints():
    if not os.path.exists(SESSION_FILE):
        print("Session file not found.")
        return
        
    with open(SESSION_FILE, "r") as f:
        session = json.load(f)
        
    token = session.get("session_token")
    device_id = session.get("device_id", "STM_DEVICE_001")
    
    headers = {
        "Content-Type": "application/json",
        "x-device-id": device_id,
        "Authorization": f"Bearer {token}"
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        for path in ["/portfolio/user_funds_and_margin", "/portfolio/holdings", "/portfolio/positions"]:
            try:
                url = f"https://uatapi.nubra.io{path}"
                print(f"\nFetching {url}...")
                r = await client.get(url, headers=headers)
                print(f"Status: {r.status_code}")
                print(f"JSON: {json.dumps(r.json(), indent=2)[:800]}")
            except Exception as e:
                print(f"Error fetching {path}: {e}")

if __name__ == "__main__":
    asyncio.run(test_endpoints())
