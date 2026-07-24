# Frontend Visual, UX & Data Integration Audit: Stalk Market

This audit evaluates the user experience, styling alignment, data integration, and layout inconsistencies of the **Stalk Market** frontend.

## 1. Branding & Identity

- **Name Inconsistency**: Currently using `"STALKTHEMARKET"` in uppercase across various loading screens, headers, and sidebar logos.
  - *Fix*: Rename to `"STALK MARKET"` with a simple text-only presentation.
- **Logo Presentation**:
  - *Current*: Logo is enclosed in a stylized container (`bg-accent/40 rounded-xl border border-border`) with an AI sparkles icon and hover animation.
  - *Fix*: Remove the sparkles icon, remove the container, and remove any hover animations. Display a clean, left-aligned, simple text placeholder: `STALK MARKET`.

## 2. Layout & Spacing Rhythm

- **Market Pulse Section**:
  - *Current*: There is a large gap and empty space above the "Top Opportunities" title, throwing off the vertical alignment.
  - *Fix*: Match vertical gaps with the 24px layout spacing system. Reduce the spacing between the Market Pulse banner and the Top Opportunities grid to 24px.
- **Sidebar**:
  - *Current*: Groupings for Workspace, Knowledge Base, and Live Indices are tightly packed, making it hard to scan.
  - *Fix*: Increase spacing between groupings, reduce text weight for section headers, and style Live Indices cards using the standard design system.

## 3. Component Consistency & Design System

- **Opportunity Cards**:
  - *Current*: Score is in a tiny circular badge; the mini sparkline is mock/static and provides false confidence; price and parameters (Entry, Target, Stop) compete equally for attention.
  - *Fix*:
    1. Remove the preview graph entirely.
    2. Replace it with helpful Signal Tags (e.g. `Volume Surge`, `Breakout`, `Strong Trend`, `Near Support`, `Relative Strength`) dynamically selected or returned from the backend.
    3. Revise hierarchy: display the Stock Symbol and Sector on top, followed by a large score number with the label "Score" beneath it. Color-code the score:
       - 90+ score: `#16A34A` (Green)
       - 80–89 score: `#22C55E` (Emerald)
       - 70–79 score: `#F59E0B` (Amber)
       - Below 70 score: `#EF4444` (Red)
    4. Display current price next to the score.
    5. Place Entry, Target, and Stop Loss parameters in a secondary, less prominent grid.
- **Hover States**:
  - *Current*: Cards use high-contrast black outlines and glow effects on hover.
  - *Fix*: Replace with a background-only color transition. Default: `#FFFFFF` -> Hover: `#F8FAFC` (light mode) with a smooth transition of `150ms ease`. No outlines, border changes, or shadow glows.
- **Live Indices Card**:
  - *Current*: Nifty/Sensex cards in the sidebar look detached with different styles.
  - *Fix*: Redesign using the same card styling, padding, and corner radius (`16px`) as Top Opportunities.
- **Search Bar**:
  - *Current*: Simple border box without an input icon or proper padding.
  - *Fix*: Add a proper search icon, and align input/dropdown height to 40px (md) and 32px (sm) with a `12px` border radius.
- **Dark Mode Toggle**:
  - *Current*: A plain button without a clear toggle track.
  - *Fix*: Build a standard toggle track styling, using Sun and Moon icons, adhering to design token tokens.
- **Dropdowns**:
  - *Current*: Sector and sort selectors use browser-default styles or varying padding.
  - *Fix*: Apply uniform height (32px), border radius (12px), background, and padding across all select dropdowns.

## 4. Data & Logic Integration

- **Chatbot Grounding**:
  - *Current*: General chat replies are mocked or statically hardcoded when API keys are missing, and general questions don't use real financial formulas or data.
  - *Fix*: Hook up the chatbot so it detects specific questions:
    - `"What is RSI?"` -> Return actual Relative Strength Index calculation formula and usage explanation.
    - `"{Symbol}"` (e.g. `"HFCL"`) -> Fetch live price and key metrics for the symbol from the backend and print a structured text summary.
    - `"Compare {Sym1} and {Sym2}"` -> Call yfinance details for both and return a structured side-by-side markdown table comparison.
- **Nubra Broker API Connection States**:
  - *Current*: If Nubra APIs are unauthenticated or failing, they fail silently or use fake mock data.
  - *Fix*: Capture API status and present descriptive messages such as `Not Connected`, `Invalid Credentials`, `Rate Limited`, or `Market Data Unavailable`.
- **Error Handling Component**:
  - *Current*: System alerts are generic.
  - *Fix*: Create a reusable, elegant error component showing the Title, Reason, Suggested Action, and a Retry button.
