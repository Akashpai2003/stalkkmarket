# Memory

## Product Vision
STALK MARKET: A clean, minimal, and premium AI-assisted swing trading workspace focused on simplicity, clarity, research workflow, and opportunity discovery. It integrates Yahoo Finance data and automates execution via the Nubra API, while training itself on custom user uploads.

## Important Decisions
- Renamed the project from "STALKTHEMARKET" to "STALK MARKET".
- Standardized text-only branding logo for STALK MARKET to keep a premium aesthetic and remove unnecessary containers and animations.
- Classified `docs/project_context.md` and `docs/reference_rules.md` as protected foundational files.

## Design Decisions
- Adopt a Perplexity-like or Linear-like modern AI workspace design instead of a traditional charts-heavy trading terminal.
- Standardized spacing scale: strictly 4, 8, 12, 16, 24, 32px values.
- Standardized corner radii: Cards: 16px, Inputs/Buttons: 12px, Pills: 999px.
- Standardized colors: monochromatic slate theme in light/dark modes with color-coded success/warning/error states.
- Standardized typography: Geist/Inter sans-serif family only, with strict scale (Heading XL: 32px, Heading L: 24px, Heading M: 20px, Body: 14px, Caption: 12px).
- Modified opportunity cards to remove fake charts and show Signal Tags and score values color-coded: 90+ (#16A34A), 80-89 (#22C55E), 70-79 (#F59E0B), <70 (#EF4444) with secondary trade parameters.
- Designed premium toggle track switch for Dark Mode.
- Integrated standard `select-sm` and `select-md` heights (32px/40px) and 12px border radius.
- Standardized sidebar layout with clean spacing, group grouping, and card-style Live Indices matching opportunities.
- Created reusable `ErrorDisplay` component with Title, Reason, suggested Action, and Retry buttons.

## Architecture & Performance Decisions
- parallelized data fetching: Nifty, Sensex, and opportunity tickers are retrieved concurrently in backend thread pools using `asyncio.to_thread` and `asyncio.gather`.
- Non-blocking server startup: Nubra session validity checking is run as an asynchronous task in the background, allowing the server to boot instantly.
- Connected chatbot directly to Yahoo Finance: parsed requests for RSI details, stock tickers (e.g. "HFCL"), and side-by-side stock comparisons to construct real data tables and insights, returning error states when APIs are offline (no fake answers).
- Nubra broker stats returns explicit error codes (Rate Limited, Invalid Credentials, API Timeout, etc.) to prompt proper frontend error states instead of silent failures.
- Adopted `chromadb` as the lightweight vector database to store document chunk embeddings for the AI self-training playbook module.
- Multi-tier Market Data Architecture: Integrated Yahoo Finance as primary, with NSE Public Data and Stooq as live fallbacks, using local caching and zero fake defaults.
- Dynamic scoring engine: Computes swing trade setup scores (0-100) dynamically using real-time and 3-month daily candle history (RSI, volume expansion, SMAs, volatility) based on docs/scoring_engine.md.
- Local stock index: Created stock_index.json containing NIFTY 100 constituents to enable debounced, case-insensitive, local search suggestions in CommandK.tsx without API roundtrips.
- Conversational stock resolution: Implemented robust mapping of common company names, abbreviations, and shorthand (e.g. "Tata Motors", "HDFC Bank") to NSE symbols in the backend chat engine.
- Replaced rigid home workflow tabs with 4 structured workflow entry points: "Explore the Market", "Analyze a Stock", "Compare Stocks", and "Explore My Portfolio", which load generative UI components (heatmaps, progress bars, allocation lists) in the sidebar with back-navigation and follow-up query links.
- Made the portfolio Generative UI compilation fully robust against both symbol list payloads and object holdings datasets.
- Custom loaders with dynamic progress: Integrated an organic breathing/morphing blob loader state on the frontend that transitions through context-specific text ("Checking market data...", "Reviewing technical signals...") based on actual server API request latency.
- Robust Generative UI DSL Parser: Rewrote the frontend OpenUI Lang parser to scan code token by token, supporting multi-line strings, escape sequence unescaping, trailing commas, and comments, eliminating parse failures on multi-line LLM responses.
- Container-Relative Layout Breakpoints: Migrated all media queries (`md:`, `sm:`) inside the Generative UI components to container queries (`@xl:`, `@md:`) using Tailwind CSS v4 on the wrapper `@container`. This guarantees that components lay out and stack perfectly relative to the width of the chatbot sidebar (440px) or mobile views without squishing.
- Backend Generative UI Validation and Fallbacks: Configured Gemini to output a `text_summary` conversational explanation and implemented python-side validation of OpenUI Lang. If the generated code is empty or invalid, the backend automatically wraps the `text_summary` inside a valid visual `TextResponse` component.


## Things To Avoid
- Avoid experiences resembling traditional broker dashboards (e.g., TradingView, Zerodha, Upstox, Angel One).
- Avoid feature bloat, excessive charts, information overload, and complex portfolio systems.
- Avoid fake chart confidence, hardcoded/mock replies, or simulated sparklines/scores.
- Avoid synchronous blocking calls in FastAPI async handlers.
- Avoid displaying stale data without clear timestamps.

