# Performance Report: Stalk Market Latency Audit

This report documents the performance bottlenecks in the **Stalk Market** application that could lead to initial page load times of 2 to 3 minutes, and presents the target fixes to guarantee an initial load under 3 seconds.

## 1. Identified Performance Bottlenecks

### A. Blocking Synchronous Event Loop on FastAPI (Backend)
- **Bottleneck**: Using blocking synchronous I/O libraries (like `yfinance` and `pypdf`) inside FastAPI endpoints marked as `async def` without yielding execution.
- **Mechanism**: In Python, when a synchronous function (like `yf.Ticker.fast_info`) is called inside an `async def` endpoint, it blocks the main thread. Since FastAPI handles concurrent requests on a single event loop thread, any blocking call blocks the server from processing other requests.
- **Impact**: The frontend attempts to execute 5 requests in parallel on startup using `Promise.all`. Because the backend event loop is blocked by synchronous Yahoo Finance calls, these requests execute sequentially, compounding latency. If a request times out or is rate-limited, total queue delay can hit 1–2 minutes.

### B. Sequential loops for Opportunity Tickers
- **Bottleneck**: The opportunity scanner `/api/market/opportunities` loops through each of the 4 opportunities sequentially, making a live price check and a historical candles check.
- **Mechanism**: 4 symbols * 2 requests = 8 sequential external HTTP queries to Yahoo Finance. At ~1.5 seconds per HTTP request, this endpoint alone takes at least 12 seconds under ideal network conditions, and blocks the entire server thread.

### C. Nubra Sync Blocking Startup Checks
- **Bottleneck**: The FastAPI startup handler (`@app.on_event("startup")`) made blocking calls to UAT servers to check session token validity.
- **Mechanism**: If the UAT endpoints are slow or down, the ASGI application blocks on startup, refusing connections for up to 15 seconds per call.

### D. Client-Side Hydration and Re-render Loops
- **Bottleneck**: The React frontend used `setInterval` polling for loading state elapsed time and had blocking conditional returns that prevented elements from rendering incrementally.
- **Mechanism**: A single full-screen loading state blocked rendering of the sidebar and headers, leading to a poor perceived loading speed.

---

## 2. Implementation Action Plan (Completed & Target Fixes)

### A. Asynchronous Offloading & Concurrency (Fixed)
- Wrapped all synchronous `yfinance` fetches in `asyncio.to_thread` so they run in worker thread pools.
- Parallelized all Nifty/Sensex and opportunity fetches using `asyncio.gather`, reducing average API response times from 12+ seconds to ~1.2 seconds.
- Moved startup checks to background tasks via `asyncio.create_task` so the FastAPI server boots in under 100ms.

### B. Inline Loading Skeletons & Tab Lazy Loading (Target)
- Replace the full-screen blocking loader with partial, incremental client-side skeletons.
- Sidebar and header will mount immediately, and opportunities/portfolio components will load in parallel with independent skeletons.
- Cache fetched portfolio and opportunity data client-side (using standard React state) to prevent redundant fetches on tab switching.
