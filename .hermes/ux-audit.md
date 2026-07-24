# UX Audit — AI Research Assistant Dashboard

## Scoring
| Criteria | Score | Critical Issues |
|----------|-------|-----------------|
| Visual Hierarchy | 3/5 | Card colors inconsistent, no clear visual layering |
| Spacing & Composition | 3/5 | Home view has gap at bottom, content doesn't fill |
| Color Usage | 2/5 | **6 different card colors**, hardcoded hex everywhere |
| Typography | 2/5 | `text-[9px]` below type scale, `text-[14.5px]` no match |
| Accessibility | 3/5 | Small text (9px), touch targets OK on desktop |
| States & Edge Cases | 3/5 | Loading/empty states exist but basic |
| Consistency | 2/5 | No single card color, mixed border styles, mixed button styles |
| Craft & Polish | 2/5 | Arbitrary font sizes, hardcoded colors bypassing design tokens |

## P0 — Must Fix

| # | Problem | Location | Fix |
|---|---------|----------|-----|
| 1 | **TradingPerformance legend: `text-[9px]`** — illegible | Lines 431-441 | Change to `text-[10px]` or `text-2xs` |
| 2 | **TradingPerformance value text `text-2xl` (24px)** too large for compact card | Lines 304-328 | Reduce to `text-lg` (16px) or `text-xl` (20px) |
| 3 | **6 different card/background colors** — no visual cohesion | `bg-[#0E0F0F]`, `bg-[#0E0E11]`, `bg-[#141417]`, `bg-[#070709]`, `bg-card`, `bg-[#121214]` | Unify to `bg-card` (`--card: #111212`) everywhere |

## P1 — Should Fix

| # | Problem | Location | Fix |
|---|---------|----------|-----|
| 4 | **`text-[14.5px]`** not in type scale | Chatbot.tsx analysis text | Use `text-sm` (13px) or `text-base` (14px) |
| 5 | **`text-[9px]`** smaller than defined min (11px) | Legend, various | Replace with `text-[10px]` minimum |
| 6 | **Button styles** inconsistent across app — send btn, aspect chips, action cards | Chatbot.tsx everywhere | Create semantic button classes or use consistent inline styles |
| 7 | **Hardcoded hex borders** `border-white/[0.06]` instead of `border-border` | Multiple components | Replace with `border-border` token |
| 8 | **Home view** doesn't fill height — `pb-24` hack | Chatbot.tsx home view | Use flex layout without absolute-positioned bottom bar |

## P2 — Nice to Fix

| # | Problem | Location | Fix |
|---|---------|----------|-----|
| 9 | AI blob has warm colors (yellow/orange) incompatible with B&W | index.css | Make grayscale |
| 10 | Multiple back navigation paths | Chatbot.tsx | Already fixed |
| 11 | No focus indicators on interactive elements | Multiple | Add `focus-visible` styles |
