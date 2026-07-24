# Performance Audit: Stalk Market

This audit evaluates the API latency, blocking calls, and client rendering bottlenecks in **Stalk Market**.

## 1. Identified Performance Bottlenecks

### A. Blocking Synchronous yfinance Calls on the FastAPI Main Thread
- **Problem**: Python `yfinance` methods (e.g. `yf.Ticker(symbol).fast_info` and `yf.Ticker(symbol).history()`) perform synchronous network requests. FastAPI runs endpoints declared with `async def` directly on the main event loop. Calling synchronous blocking network functions inside `async def` endpoints blocks the entire event loop, preventing FastAPI from processing other requests concurrently.
- **Impact**: Parallel client requests (such as the 5 startup endpoints called by `App.tsx` via `Promise.all`) are queued and executed sequentially instead of concurrently.

### B. Serial Request Loops in Ticker Scans
- **Problem**: The `/api/market/opportunities` endpoint loops through 4 stock symbols sequentially. For each symbol, it fetches live quotes AND 5-day historical candle data. This results in 8 sequential blocking network requests.
- **Impact**: With a typical Yahoo Finance latency of 1–1.5 seconds per request, this single endpoint takes 8–12 seconds to complete under normal conditions, and much longer if rate limits or DNS delays occur.

### C. Blocking Startup Check
- **Problem**: On startup, the backend runs a session validity check. If the Nubra API UAT endpoints (`https://uatapi.nubra.io`) are down, slow, or rate-limiting, the startup event blocks.
- **Impact**: The uvicorn server hangs on start and does not accept connections until the HTTP timeout (15 seconds per call) is reached.

---

## 2. Proposed Improvements & Implementation Plan

### A. Parallelize and Offload Synchronous Calls
- Use `asyncio.to_thread` (available in Python 3.9+) to run synchronous yfinance blocks in external worker threads.
- Replace sequential loops with `asyncio.gather` to execute all ticker fetches concurrently.
- **Target**: Reduce the `/api/market/opportunities` latency from 12+ seconds to the maximum duration of a single request (~1.2 seconds).

### B. Implement Request Caching
- Ensure in-memory caches inside `yahoo_finance.py` have a reasonable TTL (`CACHE_PRICE_DURATION = 30.0` seconds, `CACHE_CANDLE_DURATION = 300.0` seconds) and are thread-safe.

### C. Remove Full-Screen Blocking Hydration
- Instead of showing a full-screen blocking loader in the frontend, implement inline loading indicators, cache-first local state, or UI loading skeletons for Top Opportunities and Portfolio views.
- Permit the app header and sidebar to render instantly while background data fetches resolve.
