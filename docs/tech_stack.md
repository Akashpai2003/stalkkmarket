# Tech Stack - StalkTheMarket

## 1. Frontend Architecture
*   **Framework:** React (built with Vite) + TypeScript
    *   *Why:* Vite offers immediate Hot Module Replacement (HMR) for visual design. TypeScript guarantees type safety for the order schemas, holdings data, and API payloads.
*   **Styling & Design System:** Tailwind CSS v4 + shadcn UI components + Vanilla CSS customizations
    *   *Why:* shadcn UI provides premium, accessible, and clean component primitives (such as charts, tables, dialogs, and forms) natively supported by Tailwind v4. We layer bespoke Vanilla CSS variables and micro-animations on top to achieve the premium Perplexity/Linear-style glassmorphism.
*   **Charting Library:** Recharts (integrated natively in shadcn UI chart wrappers) and TradingView Lightweight Charts for minimal interactive charts.


## 2. Backend Architecture
*   **Language & Framework:** Python 3.10+ + FastAPI
    *   *Why:* Python handles financial calculations and document parsing/AI training pipelines. FastAPI is async, fast, and auto-generates OpenAPI documentation.

## 3. Core Integrations & Libraries

### Yahoo Finance Data Service
*   **Library:** `yfinance`
*   **Usage:**
    *   Retrieve historical EOD/candle data (`charts/timeseries` proxy equivalent).
    *   Fetch previous day close and live stock info.

### Nubra Stock API Integration
We communicate directly with the Nubra REST API using Python's async `httpx` client.

*   **Environments:**
    *   UAT API Base: `https://uatapi.nubra.io`
    *   Production API Base: `https://api.nubra.io`
*   **Authentication Flow:**
    1.  `POST /sendphoneotp` (Payload: `{"phone": "...", "skip_totp": false}`) -> Returns `temp_token` and `next: VERIFY_MOBILE`.
    2.  `POST /sendphoneotp` (Headers: `x-temp-token: temp_token`, Payload: `{"phone": "...", "skip_totp": true}`) -> Returns updated `temp_token`.
    3.  `POST /verifyphoneotp` (Headers: `x-temp-token`, `x-device-id`, Payload: `{"phone": "...", "otp": "..."}`) -> Returns `auth_token` and `next: ENTER_MPIN`.
    4.  `POST /verifypin` (Headers: `x-device-id`, `Authorization: Bearer auth_token`, Payload: `{"pin": "..."}`) -> Returns `session_token`.
*   **Core Portfolio & Execution Endpoints:**
    *   **User Funds & Margin:** `GET /portfolio/user_funds_and_margin` (Fetches account balances).
    *   **Holdings:** `GET /portfolio/holdings` (Fetches EOD demat stocks and statistics).
    *   **Positions:** `GET /portfolio/positions` (Fetches open/closed stock and derivative positions).
    *   **Order Placement:** `POST /orders/v2/single` (Payload: regular/stoploss/iceberg buy/sell order parameters).
    *   **Margin Required:** `POST /orders/v2/margin_required` (Payload: `{"with_portfolio": true, "order_req": ...}`).
    *   **Order Book Status:** `GET /orders/v2` (Fetches active/executed orders).

### AI Self-Training Pipeline
*   **Context Parsing:** `pypdf` (for PDF uploads) and custom text text-splitting.
*   **Vector Search & RAG:** Local file-based vector index or `chromadb` (lightweight SQLite-backed vector DB).
*   **AI Engine:** Google Gemini API (utilizing the `google-generativeai` SDK) to analyze trade structures, compare scrips, and cross-reference with the user's custom-uploaded swing playbooks.
