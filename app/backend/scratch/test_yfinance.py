import requests
import json

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json,text/plain,*/*",
})

url = "https://query1.finance.yahoo.com/v8/finance/chart/RELIANCE.NS"
params = {
    "range": "3mo",
    "interval": "1d",
    "includePrePost": "false",
}

try:
    print("Sending request to Yahoo Finance...")
    response = session.get(url, params=params, timeout=10.0)
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"Response Content (first 500 chars): {response.text[:500]}")
except Exception as e:
    print(f"Error occurred: {e}")
