# Design System Audit: Stalk Market

This audit reviews the visual tokens and styling consistency of the **Stalk Market** frontend application.

## 1. Design Token Specifications

### Spacing Scale
All margins, padding, and layout gaps must adhere strictly to the following 6-point spacing scale. No arbitrary values.
- **4px** (`0.25rem` / `space-1` or `p-1`) - Smallest unit for labels, micro-gaps.
- **8px** (`0.5rem` / `space-2` or `p-2`) - Default padding/margin for inner elements, badges.
- **12px** (`0.75rem` / `space-3` or `p-3`) - Standard inner padding for small cards, inputs, buttons, dropdowns.
- **16px** (`1rem` / `space-4` or `p-4`) - Standard card padding, grid gaps.
- **24px** (`1.5rem` / `space-6` or `p-6`) - Section gaps, main container padding, sidebar spacing.
- **32px** (`2rem` / `space-8` or `p-8`) - Major layout gaps, hero sections, modal padding.

### Border Radius
Standardized corners across the entire application:
- **Cards**: `16px` (`rounded-2xl` or `var(--radius-card)`)
- **Inputs**: `12px` (`rounded-xl` or `var(--radius-input)`)
- **Buttons**: `12px` (`rounded-xl` or `var(--radius-button)`)
- **Pills/Badges**: `999px` (`rounded-full`)

### Colors System
Unified colors to reduce visual noise and match a premium, clean aesthetic.

| Token | Light Mode Value | Dark Mode Value | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Text** | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Main headings, prices, active items |
| **Secondary Text** | `#64748B` (Slate 500) | `#94A3B8` (Slate 400) | Captions, subtitles, secondary details |
| **Border** | `#E2E8F0` (Slate 200) | `#334155` (Slate 700) | Card borders, dividers, inputs, buttons |
| **Surface** | `#FFFFFF` | `#0F172A` (Slate 900) | Card backgrounds, dropdown menus, sidebar |
| **Background** | `#F8FAFC` (Slate 50) | `#020617` (Slate 955) | App-wide layout background |
| **Success** | `#22C55E` (Green 500) | `#22C55E` (Green 500) | Positive P&L, high scores (80-89) |
| **Success Dark** | `#16A34A` (Green 600) | `#16A34A` (Green 600) | Elite score (90+) |
| **Warning** | `#F59E0B` (Amber 500) | `#F59E0B` (Amber 500) | Warning states, moderate scores (70-79) |
| **Error** | `#EF4444` (Red 500) | `#EF4444` (Red 500) | Negative P&L, stop loss, low scores (<70) |

### Typography Hierarchy
One single font family: `Geist` (or default sans-serif falls back to system sans-serif). Do not mix font families between metrics, numbers, and content.
- **Heading XL (Page Title)**: `32px` (`text-3xl`), font-weight `700`, line-height `1.25`
- **Heading L (Section Title)**: `24px` (`text-2xl`), font-weight `600`, line-height `1.3`
- **Heading M (Card Title)**: `20px` (`text-xl`), font-weight `600`, line-height `1.4`
- **Body Text**: `14px` (`text-sm`), font-weight `400` or `500` for medium emphasis
- **Caption / Small**: `12px` (`text-xs`), font-weight `400` or `600` for bold labels

### Hover States
Remove aggressive black outlines, harsh borders, and glowing drop-shadow state changes.
- **Interactive Cards & Buttons**: Transition background color only.
- **Default (Light)**: Background `#FFFFFF`, Border `#E2E8F0`
- **Hover (Light)**: Background `#F8FAFC`, Border `#E2E8F0` (No outline, no glow)
- **Default (Dark)**: Background `#0F172A`, Border `#334155`
- **Hover (Dark)**: Background `#1E293B` (Slate 800), Border `#334155` (No outline, no glow)
- **Transition**: `150ms ease` for background changes.

---

## 2. Identified Inconsistencies & Fixes

1. **Border Radii**:
   - *Current*: Inputs and buttons use generic classes like `rounded-lg` or `radius-sm` (6px) or `radius-md` (8px). Cards use `rounded-xl` (14px).
   - *Fix*: Standardize utility classes or CSS variables for buttons and inputs (`12px`) and cards (`16px`) globally.
2. **Spacing Rhythm**:
   - *Current*: Dashboard columns use `gap-6` (24px) but inner elements use arbitrary margins like `mt-1.5`, `pt-2`, `pb-2`, etc.
   - *Fix*: Re-align all margins, paddings, and flex/grid gaps to match the `4, 8, 12, 16, 24, 32` spacing scale.
3. **Typography**:
   - *Current*: Numbers and prices are using separate mono styles in some parts of the dashboard while labels are using a separate hierarchy.
   - *Fix*: Apply unified sans-serif font family `font-sans` with exact sizing to both content text and metrics numbers.
