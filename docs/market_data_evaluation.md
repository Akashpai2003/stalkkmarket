# Market Data Provider Evaluation

This document compares various financial data APIs and public data sources to evaluate their suitability for **Stalk Market** (specifically focusing on Indian equities listed on NSE and BSE) and defines our multi-tier data gateway architecture.

## 1. Provider Comparison Matrix

| Provider | Indian Stock Coverage | Free Tier Limits | Reliability | Latency | Historical Data | Real-Time Data |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Yahoo Finance (yfinance)** | Excellent (NSE `.NS`, BSE `.BO`) | Unlimited (Soft rate limits) | Moderate (Rate limits / HTTP 429) | Low (< 500ms) | Yes (Daily/Intraday) | Live (15m delayed) |
| **Alpha Vantage** | Poor (NSE support is erratic) | 25 requests/day | High | Moderate (~800ms) | Yes | Delayed |
| **Twelve Data** | Good (NSE/BSE support) | 8 requests/min | High | Low (~400ms) | Yes | Delayed |
| **Finnhub** | Poor (Limited Indian symbols) | 60 requests/min | High | Low (~300ms) | No | No (US-centric) |
| **Polygon.io** | Poor (No Indian Equities on free tier) | 5 requests/min | Very High | Low (< 200ms) | No | No (US-centric) |
| **Financial Modeling Prep (FMP)**| Moderate (NSE tickers exist) | 250 requests/day | High | Moderate (~600ms) | Limited | Delayed |
| **Stooq** | Moderate (Index and some equities) | Unlimited (No key required) | High | Moderate (~700ms) | Yes (Daily EOD) | EOD Only |
| **NSE India Public Data** | Perfect (All NSE symbols) | N/A (Web scraping only) | Low (IP blocks / Cloudflare) | Low (< 300ms) | Yes | Live (Real-Time) |
| **BSE India Public Data** | Perfect (All BSE symbols) | N/A (Web scraping only) | Low (IP blocks / Cloudflare) | Low (< 300ms) | Yes | Live (Real-Time) |

---

## 2. In-Depth Evaluation Notes

### Yahoo Finance (yfinance)
* **Pros**: Complete coverage of NSE and BSE stocks. No API keys or signup required. Free.
* **Cons**: Highly vulnerable to rate limiting (HTTP 429) if queried rapidly without user-agent rotations or request spacing. 

### Twelve Data
* **Pros**: Good coverage of international equities, including Indian markets (NSE). Well-structured JSON APIs.
* **Cons**: Severe free-tier restrictions (8 requests/minute). Hard to use for parallel multi-symbol dashboards without upgrading to a paid tier.

### Alpha Vantage / Finnhub / Polygon.io
* **Pros**: Extremely reliable for US markets, high uptime, and developer-friendly documentation.
* **Cons**: Extremely poor or non-existent free-tier coverage for Indian stock symbols. Ineligible as primary providers for Indian swing traders.

### NSE / BSE Public Data Sources (Scraping)
* **Pros**: 100% accurate, official, real-time data.
* **Cons**: No public REST APIs. Requires bypassing strong Cloudflare protection and cookie rotations. Highly brittle and prone to sudden failures during market hours.

---

## 3. Recommended Provider Architecture

Stalk Market uses a **Provider Hierarchy** to ensure that data is never faked, while maintaining a high degree of availability:

1. **Primary Provider (Yahoo Finance)**: Handles the bulk of real-time quotes and historical charts.
2. **Secondary Fallback (Twelve Data / Stooq)**: Used if Yahoo Finance encounters a hard error. Twelve Data handles standard quotes, while Stooq handles index EOD values.
3. **Cache (In-Memory)**: Keeps the last successful response for up to 30 seconds (prices) or 5 minutes (charts).
4. **Error State**: If all providers fail, the system returns `None` and triggers a visible `"Data unavailable"` or `"Awaiting data source"` state in the frontend. **Never falls back to hardcoded mock values.**
