# Task Checklist

Track the progress of the Backend + UX + Functionality Audit Pass.

- [x] Create `docs/task_checklist.md` and `docs/prompt_history.md`
- [x] Investigate performance and generate `docs/performance_report.md`
- [x] Implement Yahoo Finance Health Check (fetch sample stock every 5 mins and save state)
- [x] Implement actual Nubra account data fetching (cash, margin, capital) and validation of connection endpoints (auth, funds, holdings, positions, order execution) before showing "Synced"
- [x] Add backend support for URL/Website/Article ingestion (fetch, parse, chunk, embed)
- [x] Redesign AI Chatbot responses (Perplexity-style clean responses, parsing RSI, Stock Lookup, Comparisons, and Portfolio queries like available cash)
- [x] Audit Typography (weights 400, 500, 600 only, avoiding 700+)
- [x] Audit Shadows (reduce to 0 1px 2px rgba(15,23,42,0.04) or remove)
- [x] Spacing Pass (Market Pulse spacing, vertical rhythm, and dashboard gaps)
- [x] Redesign Sidebar (replace Knowledge Base section with Knowledge Sources)
- [x] Redesign Playbook Training Page (two-column layout: left side for upload/url forms; right side for list of sources and status)
- [x] Create UI Settings Page showing Yahoo Finance health, Nubra integration status, and Knowledge base statistics
- [x] Audit all Dropdowns for height, radius, font, hover, and focus consistency
- [x] Verify functionality of all backend endpoints and frontend UI states

## Data Integrity + Market Data + Search System Audit (June 13, 2026 Pass)
- [x] Eliminate mock data and simulated prices under rate limits; return "Data unavailable" or stale cache with timestamps.
- [x] Implement dynamic Indian Market session detection (IST timezone, pre/post/weekend states, next open calculation).
- [x] Create `docs/market_data_evaluation.md` comparing APIs (yfinance, Twelve Data, Stooq, NSE/BSE Public).
- [x] Implement Provider Hierarchy architecture: Yahoo Finance (Primary) -> NSE Public / Stooq (Fallback) -> Cache -> Error State.
- [x] Replace simulated sparklines with dynamic charts or Signal Tags when real data is unavailable.
- [x] Document scoring logic in `docs/scoring_engine.md` and implement active technical indicator calculation (RSI, volume ratio, SMAs, volatility) for opportunities and stock details.
- [x] Create local stock index `stock_index.json` containing NIFTY 100 constituents with Symbol, Name, Sector.
- [x] Optimize search experience in `CommandK.tsx` using local index (instant, debounced, case-insensitive).
- [x] Align Sector dropdown, Sort dropdown, and Command K search suggestions under same design tokens (radius, font, height, hover/focus).
- [x] Expand Settings page to show multi-tier market data provider sync and error stats.

