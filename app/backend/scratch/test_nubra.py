import asyncio
import httpx
import json
import os

SESSION_FILE = r"C:\Users\akash\Stock trading AI Analysis\app\backend\db\nubra_session.json"

async def test_nubra():
    if not os.path.exists(SESSION_FILE):
        print("Session file not found.")
        return
        
    with open(SESSION_FILE, "r") as f:
        session = json.load(f)
        
    token = session.get("session_token")
    device_id = session.get("device_id", "STM_DEVICE_001")
    phone = session.get("phone")
    mpin = session.get("mpin")
    
    print(f"Loaded session for phone: {phone}")
    print(f"Token (first 30 chars): {token[:30]}...")
    
    headers = {
        "Content-Type": "application/json",
        "x-device-id": device_id,
        "Authorization": f"Bearer {token}"
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        # Test UAT
        try:
            print("\nTesting UAT (https://uatapi.nubra.io)...")
            url = "https://uatapi.nubra.io/portfolio/user_funds_and_margin"
            r = await client.get(url, headers=headers)
            print(f"UAT Status: {r.status_code}")
            print(f"UAT Body: {r.text[:500]}")
        except Exception as e:
            print(f"UAT Error: {e}")
            
        # Test PROD
        try:
            print("\nTesting PROD (https://api.nubra.io)...")
            url = "https://api.nubra.io/portfolio/user_funds_and_margin"
            r = await client.get(url, headers=headers)
            print(f"PROD Status: {r.status_code}")
            print(f"PROD Body: {r.text[:500]}")
        except Exception as e:
            print(f"PROD Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_nubra())
