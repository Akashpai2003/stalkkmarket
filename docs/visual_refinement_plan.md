# Visual Refinement Plan

This document outlines the visual refinement plan for **StalkTheMarket** to make the UI look more premium, cleaner, modern, and AI-native without changing functionality.

## 1. Layout Improvements
*   **Grid and Flex alignments:** The dashboard tab is styled with `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">`.
*   **Equal Heights:** The AI Chatbot container height (`Chatbot.tsx`) is changed from `h-[520px]` to `h-full` (with `flex-1`), making it match the height of the left section exactly.
*   **Viewport Constraints:** The main page wrapper is set to `h-screen overflow-hidden` so that the sidebar, header, and content areas fit exactly onto the screen. Independent scroll containers (`overflow-y-auto`) are provided for the sidebar and main body area.

## 2. Typography Improvements
*   **Typography Scaling:** Global Tailwind `@theme` overrides scale up all text utility classes by approximately 10-15% (e.g. `text-xs` is 14px, `text-sm` is 16px, `text-base` is 18px).
*   **Base Text:** The body text font size is increased to 18px in `index.css`.
*   **Hierarchy Cleanliness:** Custom inline sizes like `text-[10px]` and `text-[9px]` are changed to semantic Tailwind utility classes like `text-xs` or `text-sm` with appropriate weights, ensuring readability.

## 3. Card Redesigns & Border Reduction
*   **Border reduction:** Box-in-a-box nested borders are removed. Cards are designed with a clean `#ffffff` surface in light mode (or `#18181b` in dark mode) with a single subtle `1px` border (`border-zinc-200/80` or `border-zinc-800/80`).
*   **Surface Hierarchy:** Zinc/slate fills (`bg-zinc-50/50` or `bg-zinc-900/40`) are used for internal sections (like metric boxes or headers) instead of borders.

## 4. Market Overview Redesign
*   **From Heavy to Light:** The clunky three-card grid layout is consolidated into a singular, high-density horizontal "Market Pulse" banner.
*   **Key Highlights:** Market Health, Momentum, and Volatility are laid out horizontally with large typography, colored sparklines, and a minimal capital exposure badge, removing visual bloat.

## 5. Opportunity Cards Redesign
*   **Card vs Table Row:** Opportunities are formatted into clean card elements. Each card features:
    *   **Stock Prominence:** Bold uppercase ticker symbol with a subtitle for the sector.
    *   **Score Badge:** An elegant circular score indicator colored by score strength (e.g., green tint for high scores).
    *   **Entry/Target/Stop metrics:** Laid out in a neat, well-spaced inline grid.
    *   **Buy/Watch indicators:** Subtle visual signals showing the trade setup.
    *   **Sparklines:** Safe, alphanumeric-gradient sparklines that render green/red area colors beautifully without black highlights.

## 6. Sidebar & Indices Redesign
*   **Branding:** Stronger spacing, modern logo, and a clean "AI Workspace" label.
*   **Active States:** Clear active indicators using Indigo tints (`bg-indigo-50 text-indigo-600` in light mode, `bg-indigo-950/50 text-indigo-300` in dark mode) to emphasize current tabs.
*   **Indices Widget Integration:** Styled with custom colors and aligned nicely at the bottom of the sidebar.

## 7. Chat Redesign
*   **Workflow Integration:** The chatbot input form and suggested prompts are refined with consistent button heights, clear spacing, and modern inputs.
*   **Empty State:** Styled with large spacing and clean icons, looking like an intentional, premium workspace tool rather than an afterthought.
