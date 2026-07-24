# Product Structure - StalkTheMarket

## High-Level Folder Layout
```
project/
├── references/                 # UI, wireframe, and animation references
├── docs/                       # Specifications, context, stack, and rules
├── app/
│   ├── frontend/               # Vite + React (TypeScript) + Vanilla CSS frontend
│   └── backend/                # Python (FastAPI) + RAG self-training + APIs backend
└── assets/                     # Shared static media/images/assets
```

## Detailed Application Structure

### 1. Backend (`app/backend/`)
*   `main.py` — FastAPI entry point, endpoint registrations.
*   `requirements.txt` — Python backend dependencies.
*   `services/`
    *   `yahoo_finance.py` — Fetch stock quotes and historical timeseries candles.
    *   `nubra_client.py` — Async client handles auth flow, holdings, funds, and order placement.
    *   `ai_rag.py` — Ingests user playbooks, generates embeddings, performs vector checks, and customizes Gemini analysis prompts.
*   `db/` — Handles storage of vector indexes (chromadb) and uploaded playbooks metadata.

### 2. Frontend (`app/frontend/`)
*   `package.json` — Frontend build configs and dependencies.
*   `index.html` — Entry point.
*   `src/`
    *   `main.tsx` — React entry point.
    *   `index.css` — Global styles, design tokens (zinc dark-theme, typography variables).
    *   `components/`
        *   `CommandK.tsx` — Keyboard-driven search & research command bar (Perplexity feel).
        *   `ScripAnalyzer.tsx` — AI summaries, comparison columns, and playbook alignment.
        *   `HoldingsOverview.tsx` — Balance card, current assets, EOD statistics via Nubra.
        *   `OrderTicket.tsx` — Clean order execution widget with margin checks.
        *   `PlaybookUploader.tsx` — File drag-and-drop ingestion for self-training.
    *   `services/` — Axios API client proxies to FastAPI endpoints.
