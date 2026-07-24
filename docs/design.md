---
name: shadcn/ui Charts
url: https://ui.shadcn.com/charts
colors:
  background: '#ffffff'
  background-dark: '#0a0a0a'
  foreground: '#000000'
  foreground-dark: '#fafafa'
  text-muted: '#737373'
  border: '#e5e5e5'
  border-dark: '#ffffff1a'
  primary: '#171717'
  primary-foreground: '#fafafa'
  card: '#ffffff'
  card-dark: '#171717'
  input: '#e5e5e5'
  input-dark: '#ffffff26'
  accent: '#f5f5f5'
  accent-foreground: '#171717'
  destructive: '#e40014'
  destructive-foreground: '#df2225'
  chart-1: '#d4d4d4'
  chart-2: '#737373'
  chart-3: '#525252'
  chart-4: '#404040'
  chart-5: '#262626'
typography:
  display:
    family: 'Geist'
    size: 48px
    weight: 600
    line-height: 1.2
  body:
    family: 'Geist'
    size: 16px
    weight: 400
    line-height: 1.5
  small:
    family: 'Geist'
    size: 14px
    weight: 400
    line-height: 1.5
  caption:
    family: 'Geist'
    size: 12px
    weight: 400
    line-height: 1.5
  code:
    family: 'Geist Mono'
    size: 14px
    weight: 400
    line-height: 1.5
spacing:
  base: 4px
  scale: [0, 4, 8, 12, 16, 24, 32, 40, 80, 96]
radius:
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
  full: 9999px
elevation:
  focus-ring: '0 0 0 2px rgba(0, 0, 0, 0.2)'
motion:
  duration-base: '500ms'
  easing-drawer: 'cubic-bezier(0.32, 0.72, 0, 1)'
  easing-standard: 'cubic-bezier(0.4, 0, 0.2, 1)'
components:
  button-primary:
    bg: '{colors.primary}'
    text: '{colors.primary-foreground}'
    radius: '{radius.lg}'
    padding: '10px 16px'
  button-secondary:
    bg: '{colors.accent}'
    text: '{colors.accent-foreground}'
    radius: '{radius.sm}'
    padding: '0px 8px'
  button-ghost:
    bg: 'transparent'
    text: '{colors.foreground}'
    radius: '{radius.md}'
    padding: '0px 0px'
  input:
    bg: 'transparent'
    text: '{colors.foreground}'
    border: '{colors.border}'
    radius: '{radius.lg}'
    padding: '8px 12px'
  card:
    bg: '{colors.card}'
    text: '{colors.foreground}'
    border: '{colors.border}'
    radius: '{radius.xl}'
    padding: '24px'
layout:
  max-width: 1280px
  columns: 12
  gutter: 24px
---

# Design System Inspired by shadcn/ui Charts

## 1. Visual Theme & Atmosphere
The shadcn/ui Charts page presents a clean, functional, and developer-centric aesthetic, characterized by a monochromatic color scheme and the precise, modern `Geist` typeface. The design emphasizes clarity and directness, utilizing ample `24px` to `96px` whitespace to separate content blocks and maintain visual calm. Interactive elements are subtly distinguished through `1px` borders and `6px` to `14px` border radii, with a notable absence of heavy shadows, reinforcing a flat, digital-first interface. The system supports a dark mode, switching `background` from `#ffffff` to `#0a0a0a` and `foreground` from `#000000` to `#fafafa`, maintaining its stark contrast across themes.

The visual identity is defined by its focus on data visualization, featuring interactive chart components within `14px` rounded card containers. Motion, while not overtly flashy, is present through `500ms` `cubic-bezier(0.32, 0.72, 0, 1)` transitions for drawer components and CSS keyframe animations like `fadeIn` for overlays, providing a subtle layer of responsiveness. The overall impression is one of robust utility and refined simplicity, tailored for technical documentation and component showcases.

Key Characteristics:
- `Geist` font family for all text elements.
- Monochromatic palette with `#000000` text on `#ffffff` background.
- Subtle `1px` borders and `6px` to `14px` border radii.
- Ample `24px` to `96px` whitespace for content separation.
- Minimal use of `box-shadow` for depth.
- `500ms` drawer transitions and CSS keyframe animations.
- Dark mode support with `background-dark: #0a0a0a`.

## 2. Color Palette & Roles
The color palette is primarily neutral, providing a stark, high-contrast foundation for content, with specific roles for interactive elements and data visualization.

-   **Primary**
    -   **Primary (`#171717`)**: The dominant interactive color, used for primary button backgrounds and active states, providing strong visual emphasis.
    -   **Primary Foreground (`#fafafa`)**: Text color used on `Primary` backgrounds, ensuring high readability.
-   **Accent Colors**
    -   **Accent (`#f5f5f5`)**: Used for subtle hover states, secondary button backgrounds, and muted section fills, offering a slight visual break from the main background.
    -   **Accent Foreground (`#171717`)**: Text color used on `Accent` backgrounds.
    -   **Chart 1 (`#d4d4d4`)**: Lightest shade for data series in charts.
    -   **Chart 2 (`#737373`)**: Mid-light shade for data series in charts.
    -   **Chart 3 (`#525252`)**: Mid-dark shade for data series in charts.
    -   **Chart 4 (`#404040`)**: Darker shade for data series in charts.
    -   **Chart 5 (`#262626`)**: Darkest shade for data series in charts.
-   **Interactive**
    -   **Destructive (`#e40014`)**: Used for error messages, delete actions, and other critical feedback states.
    -   **Destructive Foreground (`#df2225`)**: Text color used on `Destructive` backgrounds.
-   **Neutral Scale**
    -   **Background (`#ffffff`)**: The default page and main surface background in light mode. In dark mode, this shifts to `background-dark: #0a0a0a`.
    -   **Foreground (`#000000`)**: Primary text color for most content in light mode. In dark mode, this shifts to `foreground-dark: #fafafa`.
    -   **Text Muted (`#737373`)**: Secondary text, placeholder text, and less emphasized information.
-   **Surface & Borders**
    -   **Card (`#ffffff`)**: Background for content cards and elevated UI elements in light mode. In dark mode, this shifts to `card-dark: #171717`.
    -   **Border (`#e5e5e5`)**: Used for subtle separators, outlines of interactive elements, and card borders in light mode. In dark mode, this shifts to `border-dark: #ffffff1a`.
    -   **Input (`#e5e5e5`)**: Background/border color for input fields in light mode. In dark mode, this shifts to `input-dark: #ffffff26`.

## 3. Typography Rules
-   **Font Family**:
    -   Primary: `'Geist', sans-serif`
    -   Monospace: `'Geist Mono', monospace`
-   **Hierarchy**:
    -   **Display/H1**: `Geist` `48px` `600` · line-height `1.2` · tracking `none` · Used for main page titles.
    -   **H2**: `Geist` `30px` `600` · line-height `1.2` · tracking `none` · (inferred from screenshot) · Used for major section headings.
    -   **H3**: `Geist` `24px` `500` · line-height `1.3` · tracking `none` · (inferred from screenshot) · Used for sub-section titles.
    -   **Body**: `Geist` `16px` `400` · line-height `1.5` · tracking `none` · Used for standard paragraph text and main content.
    -   **Small**: `Geist` `14px` `400` · line-height `1.5` · tracking `none` · Used for auxiliary information, navigation links, and form labels.
    -   **Caption**: `Geist` `12px` `400` · line-height `1.5` · tracking `none` · Used for metadata, footnotes, and very small text.
    -   **Code/Mono**: `Geist Mono` `14px` `400` · line-height `1.5` · tracking `var(--tracking-wider, .05em)` · Used for code blocks and inline code.
-   **Principles**
    -   The `Geist` typeface, a modern sans-serif, is the sole font for all UI text, ensuring a unified and consistent visual voice.
    -   A clear typographic hierarchy is established through distinct `font-size` and `font-weight` combinations, ranging from `48px` `600` for display to `12px` `400` for captions.
    -   `line-height` is consistently generous at `1.5` for body text and smaller sizes, promoting readability, while display text uses a tighter `1.2`.
    -   `Geist Mono` is reserved exclusively for code-related content, providing a clear visual distinction for technical information.
    -   Text color is predominantly `var(--foreground, #000000)` or `var(--text-muted, #737373)`, maintaining a high contrast against the `var(--background, #ffffff)` surface.

## 4. Component Stylings

### Buttons

#### Primary Button
A high-contrast button for primary actions, featuring a dark background and light text. It provides a subtle scale transform on interaction.

```css
.button-primary {
  background-color: var(--primary, #171717);
  color: var(--primary-foreground, #fafafa);
  font-family: 'Geist', sans-serif;
  font-size: 14px; /* inferred from screenshot */
  font-weight: 500; /* inferred from screenshot */
  padding: 10px 16px; /* inferred from screenshot */
  border: none;
  border-radius: var(--radius-lg, 10px);
  cursor: pointer;
  transition: background-color var(--motion-duration-standard, 200ms) var(--motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1)), transform var(--motion-duration-standard, 200ms) var(--motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1));
}

.button-primary:hover {
  background-color: var(--primary, #171717); /* inferred from screenshot */
  opacity: 0.9; /* inferred from screenshot */
}

.button-primary:active {
  transform: scale(0.98); /* inferred from screenshot */
}

.button-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Secondary Button
A lighter button for secondary actions, often used for "View Code" prompts. It has a subtle background and dark text.

```css
.button-secondary {
  background-color: var(--accent, #f5f5f5);
  color: var(--accent-foreground, #171717);
  font-family: 'Geist', sans-serif;
  font-size: 12px; /* from extracted tokens */
  font-weight: 500; /* from extracted tokens */
  padding: 0px 8px; /* from extracted tokens */
  border: none;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: background-color var(--motion-duration-standard, 200ms) var(--motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1)), transform var(--motion-duration-standard, 200ms) var(--motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1));
}

.button-secondary:hover {
  background-color: var(--accent, #f5f5f5); /* inferred from screenshot */
  opacity: 0.8; /* inferred from screenshot */
}

.button-secondary:active {
  transform: scale(0.98); /* inferred from screenshot */
}

.button-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Ghost Button
A transparent button for icon-only or less prominent actions like theme toggles. It reveals a subtle background on hover.

```css
.button-ghost {
  background-color: transparent;
  color: var(--foreground, #000000);
  font-family: 'Geist', sans-serif;
  font-size: 14px; /* from extracted tokens */
  font-weight: 500; /* from extracted tokens */
  padding: 0px; /* from extracted tokens */
  border: none;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: background-color var(--motion-duration-standard, 200ms) var(--motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1)), color var(--motion-duration-standard, 200ms) var(--motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1)), transform var(--motion-duration-standard, 200ms) var(--motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1));
}

.button-ghost:hover {
  background-color: var(--muted, #f5f5f5); /* from cssVariables.scoped.theme-neutral */
  color: var(--accent-foreground, #171717); /* from cssVariables.scoped.theme-neutral */
}

.button-ghost:active {
  transform: scale(0.98); /* inferred from screenshot */
}

.button-ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Cards & Containers

#### Standard Card
Used for displaying chart components, featuring a white background, a subtle border, and large rounded corners. The card border darkens slightly on hover.

```css
.card {
  background-color: var(--card, #ffffff);
  color: var(--foreground, #000000);
  border: 1px solid var(--border, #e5e5e5);
  border-radius: var(--radius-xl, 14px);
  padding: 24px; /* inferred from screenshot */
  transition: border-color var(--motion-duration-standard, 200ms) var(--motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1));
}

.card:hover {
  border-color: var(--primary, #171717); /* inferred from screenshot */
}
```

### Inputs & Forms

#### Text Input
A text input field, visually represented by the "Search documentation..." component, featuring a transparent background and a subtle border. It gains a focus ring on interaction.

```css
.input-text {
  background-color: transparent;
  color: var(--foreground, #000000);
  font-family: 'Geist', sans-serif;
  font-size: 14px; /* from extracted tokens */
  font-weight: 500; /* from extracted tokens */
  padding: 8px 12px; /* from extracted tokens */
  border: 1px solid var(--border, #e5e5e5);
  border-radius: var(--radius-lg, 10px);
  outline: none;
  transition: border-color var(--motion-duration-standard, 200ms) var(--motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1)), box-shadow var(--motion-duration-standard, 200ms) var(--motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1));
}

.input-text::placeholder {
  color: var(--text-muted, #737373);
}

.input-text:focus {
  border-color: var(--primary, #171717); /* inferred from screenshot */
  box-shadow: var(--elevation-focus-ring, 0 0 0 2px rgba(0, 0, 0, 0.2));
}

.input-text:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Form Label
Standard label styling for form elements, using a slightly bolder weight for clarity.

```css
.form-label {
  color: var(--foreground, #000000);
  font-family: 'Geist', sans-serif;
  font-size: 14px; /* from extracted tokens */
  font-weight: 500; /* from extracted tokens */
  line-height: 1.5;
  display: block;
}
```

### Navigation

#### Top Navigation Bar
The sticky header navigation, providing global links and actions, with a subtle bottom border.

```css
.nav-bar {
  background-color: var(--background, #ffffff);
  color: var(--foreground, #000000);
  border-bottom: 1px solid var(--border, #e5e5e5);
  padding: 16px 24px; /* inferred from screenshot */
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

#### Navigation Link
Links within the main navigation or tab-like components, which change color and gain an underline on active state.

```css
.nav-link {
  color: var(--text-muted, #737373);
  font-family: 'Geist', sans-serif;
  font-size: 14px; /* from extracted tokens */
  font-weight: 500; /* from extracted tokens */
  text-decoration: none;
  padding: 8px 0; /* inferred from screenshot */
  border-bottom: 2px solid transparent;
  transition: color var(--motion-duration-standard, 200ms) var(--motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1)), border-color var(--motion-duration-standard, 200ms) var(--motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1));
}

.nav-link:hover {
  color: var(--foreground, #000000);
}

.nav-link.active,
.nav-link[aria-current="page"] {
  color: var(--foreground, #000000);
  border-bottom: 2px solid var(--foreground, #000000);
}
```

### Links

#### Standard Link
Default text links, such as those found in the footer, which are underlined and change color on hover.

```css
.link-standard {
  color: var(--foreground, #000000);
  text-decoration: underline;
  font-family: 'Geist', sans-serif;
  font-size: 16px; /* inferred from screenshot */
  font-weight: 400; /* inferred from screenshot */
  transition: color var(--motion-duration-standard, 200ms) var(--motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1));
}

.link-standard:hover {
  color: var(--primary, #171717); /* inferred from screenshot */
}

.link-standard:visited {
  color: var(--foreground, #000000); /* inferred from screenshot */
}
```

#### Secondary Link
Less prominent links, such as "Introducing GitHub Registries", which are typically smaller and use muted text color.

```css
.link-secondary {
  color: var(--text-muted, #737373);
  text-decoration: none;
  font-family: 'Geist', sans-serif;
  font-size: 14px; /* from extracted tokens */
  font-weight: 400; /* inferred from screenshot */
  transition: color var(--motion-duration-standard, 200ms) var(--motion-easing-standard, cubic-bezier(0.4, 0, 0.2, 1));
}

.link-secondary:hover {
  color: var(--foreground, #000000);
  text-decoration: underline; /* inferred from screenshot */
}

.link-secondary:visited {
  color: var(--text-muted, #737373); /* inferred from screenshot */
}
```

### Badges
(none observed in source)

## 5. Layout Principles
-   **Spacing System**: The design system uses a `4px` base unit for its spacing scale, providing granular control over layout and component relationships.
    -   Scale: `[0, 4, 8, 12, 16, 24, 32, 40, 80, 96]`
    -   Usage Context:
        -   `4px`: Minimal spacing, often between an icon and text.
        -   `8px`: Small gaps, padding for secondary buttons.
        -   `12px`: Horizontal padding for inputs, minor vertical spacing.
        -   `16px`: Standard vertical spacing between elements, padding for navigation bar.
        -   `24px`: Internal padding for cards, spacing between major components.
        -   `32px`: Larger vertical gaps, section separators.
        -   `40px`: Significant vertical spacing, hero element padding.
        -   `80px`: Large section padding, generous horizontal content margins.
        -   `96px`: Extra large vertical spacing for distinct content blocks.
-   **Grid & Container** *(Suggested — not measured)*: _Note: container widths and column counts are not extracted from the source. The values below are reasonable defaults inferred from the visible layout density._
    -   Max Width: `1280px`
    -   Columns: `12`
    -   Gutter: `24px`
    -   Section Padding: `40px 80px` (vertical, horizontal)
-   **Whitespace Philosophy**: Shadcn/ui embraces a generous whitespace philosophy, particularly in vertical rhythm and horizontal content margins. This approach creates a clean, uncluttered interface that directs focus to content and data visualizations. Ample padding around components and sections, such as `24px` within cards and `80px` for horizontal page margins, contributes to a breathable and professional aesthetic.
-   **Border Radius Scale**: The system uses a defined set of border radii to soften edges while maintaining a modern, crisp feel.
    -   `sm: 6px`: Smallest radius, used for secondary buttons and subtle accents.
    -   `md: 8px`: Medium radius, applied to ghost buttons and smaller interactive elements.
    -   `lg: 10px`: Larger radius, common for primary buttons and input fields.
    -   `xl: 14px`: Largest functional radius, prominently featured on main content cards and containers.
    -   `full: 9999px`: Reserved for perfectly circular elements, like avatars or icon buttons.

## 6. Depth & Elevation
The design system largely favors a flat aesthetic, relying on borders and background color changes over heavy shadows for distinction. When elevation is needed, it's subtle and functional.

-   **Flat (z-0)**: `none` — Default background elements, inactive states, and most static content.
-   **Interactive (z-10)**: `none` — Used for elements like tooltips or dropdown items (inferred).
-   **Overlay (z-20)**: `none` — Used for modal backdrops or popovers (inferred).
-   **Sticky (z-50)**: `none` — Applied to fixed headers and main navigation to keep them above scrolling content.
-   **Focus Ring**: `0 0 0 2px rgba(0, 0, 0, 0.2)` — Applied to interactive elements on focus for accessibility and clarity.

Shadow Philosophy: The design system is predominantly flat, utilizing `1px` borders (`var(--border, #e5e5e5)`) and distinct background colors (`var(--card, #ffffff)`) to define element boundaries and hierarchy. Shadows are minimal, primarily appearing as a `2px` focus ring (`0 0 0 2px rgba(0, 0, 0, 0.2)`) on interactive elements or for specific component states like toasts, providing subtle depth only when necessary for user feedback or accessibility.

## 7. Do's and Don'ts

### Do's
-   Use `Geist` font for all text, reserving `Geist Mono` for code snippets.
-   Maintain a clear hierarchy with `Display 48px/600` for main titles and `Body 16px/400` for paragraph text.
-   Apply `var(--radius-lg, 10px)` for inputs and primary buttons to ensure consistent rounded corners.
-   Ensure interactive elements like buttons use `var(--primary, #171717)` for background and `var(--primary-foreground, #fafafa)` for text.
-   Utilize `var(--border, #e5e5e5)` for subtle separation, like between navigation items or card outlines.
-   Use `var(--spacing-24, 24px)` for consistent padding within cards and major vertical spacing.
-   Ensure `var(--foreground, #000000)` text on `var(--background, #ffffff)` passes AAA contrast (21:1 ratio).
-   Use `var(--accent, #f5f5f5)` for secondary button backgrounds and hover states, paired with `var(--accent-foreground, #171717)` text.

### Don'ts
-   Avoid introducing custom spacing values; adhere strictly to the `[0, 4, 8, 12, 16, 24, 32, 40, 80, 96]px` scale.
-   Do not use heavy `box-shadow` for elevation; prefer `border` and `background-color` changes.
-   Refrain from using `var(--text-muted, #737373)` for primary body text on `var(--background, #ffffff)` as its 4.5:1 ratio only passes AA.
-   Do not deviate from `Geist` font weights 400, 500, and 600.
-   Avoid using `var(--radius-full, 9999px)` on rectangular elements; reserve it for truly circular shapes.
-   Do not use `var(--destructive, #e40014)` for non-critical UI elements.
-   Do not use `var(--chart-X)` colors for general UI elements; they are reserved for data visualization.
-   Avoid using `var(--primary, #171717)` for text on `var(--accent, #f5f5f5)` unless it's a specific interactive state.

## 8. Responsive Behavior *(Suggested — not measured)*
_Note: breakpoints below are industry-standard recommendations, not measurements from the source. Adjust to the brand's actual media queries when implementing._

-   **Suggested Breakpoints**:
    -   **Mobile Small** (~375px): Content stacks vertically; reduce page padding to `16px`.
    -   **Mobile Large** (~600px): Primary navigation items collapse into a hamburger menu.
    -   **Tablet** (~768px): Card layouts may shift from multiple columns to one or two.
    -   **Desktop** (~1024px): Full navigation visible; content max-width applied.
    -   **Desktop Large** (~1440px): Wider content areas, increased lateral padding.
-   **Touch Targets**:
    -   Minimum size for interactive elements should be `44px` by `44px` (inferred).
    -   Maintain at least `8px` of clear space between adjacent touch targets (inferred).
-   **Collapsing Strategy**:
    -   **Navigation**: Primary navigation links (e.g., "Docs", "Components") collapse into a hamburger menu below `600px`.
    -   **Cards**: Grid layouts displaying charts reflow to a single column on smaller screens to ensure readability.
    -   **Typography**: Display fonts may scale down on mobile to fit screen width, e.g., `Display 48px` to `32px` (inferred).
    -   **Padding**: Horizontal page padding reduces from `80px` to `16px` on mobile for better content utilization.
    -   **Forms**: Input fields maintain full width but may have reduced vertical padding on smaller screens.

## 9. Agent Prompt Guide
-   **Quick Color Reference**
    -   background: `#ffffff`
    -   background-dark: `#0a0a0a`
    -   foreground: `#000000`
    -   foreground-dark: `#fafafa`
    -   text-muted: `#737373`
    -   border: `#e5e5e5`
    -   border-dark: `#ffffff1a`
    -   primary: `#171717`
    -   primary-foreground: `#fafafa`
    -   card: `#ffffff`
    -   card-dark: `#171717`
    -   input: `#e5e5e5`
    -   input-dark: `#ffffff26`
    -   accent: `#f5f5f5`
    -   accent-foreground: `#171717`
    -   destructive: `#e40014`
    -   destructive-foreground: `#df2225`
    -   chart-1: `#d4d4d4`
    -   chart-2: `#737373`
    -   chart-3: `#525252`
    -   chart-4: `#404040`
    -   chart-5: `#262626`
-   **Iteration Guide**:
    1.  Always use `Geist` for text; `Geist Mono` for code.
    2.  Always use `Display 48px/600` for main headings.
    3.  Always use `Body 16px/400` for primary content text.
    4.  Always use spacing values from the `[0, 4, 8, 12, 16, 24, 32, 40, 80, 96]px` scale.
    5.  Always apply `var(--radius-xl, 14px)` to cards and `var(--radius-lg, 10px)` to inputs.
    6.  Always ensure Primary Buttons are `10px 16px` padding with `var(--primary, #171717)` background.
    7.  Always ensure Input fields have a `1px` `var(--border, #e5e5e5)` border and `var(--radius-lg, 10px)` radius.
    8.  Always implement `:focus` states with `var(--elevation-focus-ring, 0 0 0 2px rgba(0, 0, 0, 0.2))`.
    9.  Always use `var(--motion-duration-base, 500ms)` and `var(--motion-easing-drawer, cubic-bezier(0.32, 0.72, 0, 1))` for drawer transitions.
    10. Always ensure `var(--foreground, #000000)` on `var(--background, #ffffff)` meets AAA contrast.
    11. Always collapse main navigation to a hamburger menu below `600px`.
    12. Always use `var(--border, #e5e5e5)` for subtle separation, not heavy shadows.