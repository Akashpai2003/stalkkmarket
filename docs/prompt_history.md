# Prompt History & Recovery Log

## Prompt: Backend + UX + Functionality Audit Pass (2026-06-13)

### Core Requirements
1. **Recovery Memory**: Setup `docs/task_checklist.md` and `docs/prompt_history.md`.
2. **Performance Report**: Generate `docs/performance_report.md` explaining why initial load times are 2-3 minutes, then resolve it to get below 3 seconds.
3. **Typography Weights**: Restrict to `400` (Regular), `500` (Medium), and `600` (SemiBold). Avoid `700+` except for headings, key metrics, and actions.
4. **Shadows**: Reduce all shadows to `box-shadow: 0 1px 2px rgba(15,23,42,0.04)` or remove.
5. **Market Pulse Spacing**: Increase breathing room and spacing rhythm.
6. **Playbook Page Redesign**: Two-column layout (Left: Knowledge Sources Forms for upload/URLs; Right: Knowledge Status/Summary list).
7. **Ingestion Expansion**: Implement URL/Website crawler/parser ingestion flow in backend.
8. **Chatbot Restructuring**: Clear formatting, Perplexity-style structure. Support Knowledge, Stock Lookup, Comparisons, and Portfolio queries.
9. **Nubra Validation**: Verify all endpoints (auth, funds, holdings, positions, order access) before showing "Synced". Return explicit connection error states.
10. **Settings Page**: Show Yahoo Finance health status, Nubra account data, and Knowledge sources statistics.
11. **Yahoo Finance Health Check**: Background task checking symbol fetch status every 5 minutes.
12. **Dropdowns uniformity**: Height, radius, fonts, hover, focus.

### Architecture & Design Decisions
- **Uvicorn relink**: FastAPI background scheduler or `apischedule` block. We will create a background thread/task inside FastAPI running the Yahoo Finance health check loop.
- **Crawler**: Use `httpx` to crawl URLs, scrape text using standard HTML extraction, chunk, embed.
- **Chatbot Context**: Incorporate current live portfolio status (margin, available cash) and Yahoo Finance queries inside the chatbot retrieval-augmented prompt context to answer portfolio queries dynamically.
