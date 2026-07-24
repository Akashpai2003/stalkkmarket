import asyncio
import httpx

async def main():
    client = httpx.AsyncClient(timeout=5.0)
    base_url = "http://127.0.0.1:8000"
    
    try:
        # 1. Check initial credentials state
        res = await client.get(f"{base_url}/api/auth/credentials")
        print("Initial credentials status:", res.json())
        
        # 2. Save mock credentials
        save_res = await client.post(
            f"{base_url}/api/auth/save-credentials",
            json={"phone": "9999999999", "mpin": "4321"}
        )
        print("Save credentials response:", save_res.json())
        
        # 3. Check credentials status again
        res2 = await client.get(f"{base_url}/api/auth/credentials")
        print("Updated credentials status:", res2.json())
        
        # 4. Verify MPIN endpoint with SAVED_MPIN in mock mode
        # Set mock auth token response structure
        auth_res = await client.post(
            f"{base_url}/api/auth/verify-mpin",
            json={"pin": "SAVED_MPIN", "auth_token": "mock_auth_token_abc"}
        )
        print("Verify MPIN with SAVED_MPIN response:", auth_res.json())
        
        # 5. Clear credentials
        clear_res = await client.post(f"{base_url}/api/auth/clear-credentials")
        print("Clear credentials response:", clear_res.json())
        
        # 6. Final verification
        res3 = await client.get(f"{base_url}/api/auth/credentials")
        print("Final credentials status:", res3.json())
        
    except Exception as e:
        print("Test failed with exception:", str(e))
    finally:
        await client.aclose()

if __name__ == "__main__":
    asyncio.run(main())
