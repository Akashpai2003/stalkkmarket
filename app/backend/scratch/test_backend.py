import requests
import json
import time

try:
    start_time = time.time()
    print("Sending request to /api/stock/HFCL/details...")
    res = requests.get("http://127.0.0.1:8000/api/stock/HFCL/details", timeout=30.0)
    latency = time.time() - start_time
    print(f"Latency: {latency:.2f} seconds")
    print(f"Status Code: {res.status_code}")
    print(f"Response: {json.dumps(res.json(), indent=2)}")
except Exception as e:
    print(f"Failed: {e}")
