# OAU LMS — Agents Guide

## Design System

- **page-type**: `software`
- **site-kind**: `software`
- **Inspiration**: Harvard Canvas, Yale Canvas, Princeton LMS
- **Color palette** (Tailwind + CSS vars):
  - **Ink**: `--ink: #0F1C3A` (navy 900) — primary text
  - **Canvas**: `--bg-canvas: #F6F2EC` (stone 050) — page background
  - **Accent**: `--accent: #B8922A` (gold 500) — primary actions
  - **Stone neutrals**: `--stone-100: #EDE8E0` through `--stone-900: #2C2824`
- **Typography**:
  - **Display**: Playfair Display, 400 weight — `<h1>`, `<h2>`, `<h3>`
  - **Text**: Inter, 400/500 — UI body, inputs, labels
  - **Scale**: `h2` uses `clamp(22px, 1.8vw, 32px)` via `--t-h2`; `h1` uses `clamp(32px, 2.5vw, 48px)` via `--t-h1`
- **Radius**: `var(--r-btn: 6px)` for buttons, `var(--r-lg: 16px)` for cards, `soft` corners
- **Spacing**: 4-base scale; `--s-7: 48px` section padding
- **Buttons**: `solid` style; `.btn-primary` (navy fill), `.btn-secondary` (white outline), `.btn-ghost` (transparent)
- **Transitions**: `cubic-bezier(0.22, 1, 0.36, 1)` ease; `120ms` for background/border, `80ms` for transform

## Conventions

- **h2-first hierarchy**: Every page starts with an `<h2>` (or `<h1>` on login) using the CSS `var(--t-h2)` / `var(--t-h1)` clamp scale. Remove Tailwind `text-` classes from h2 so the CSS variable takes effect.
- **48px section padding**: Use `py-16` or the `--s-7` utility. Container uses `max-w-1200` with `px-8`.
- **Hover animations**: `transform: translateY(-1px)` on button hover; `box-shadow` raise on card hover.
- **SVG icons**: Use `fill="#0F1C3A"` for navy or `fill="#B8922A"` for gold. No gradients.
- **Focus ring**: `outline: 2px solid var(--accent); outline-offset: 2px` via `:focus-visible`.
- **Reduced motion**: `prefers-reduced-motion` kills all animations.

## Pages

| Page | Status |
|------|--------|
| LoginPage | Restyled: split layout (navy crest left, form right), Playfair Display heading, gold accent rule, `var(--...)` tokens throughout |
| DashboardPage | Restyled: TopBar with subtitle, card grid, var token forms, h2 clamp scale |
| CoursesPage | Restyled: TopBar with actions, card grid with gold top bar, empty state |
| GradebookPage | Restyled: table with badge grades, TopBar, persisting final grades |
| Sidebar | Restyled: taller, `var(--sidebar-w, 224px)`, gold hex mark, vertical nav with `:focus-visible` |
| TopBar | Extended: accepts `subtitle` prop, consistent branding |
| OauBadge | Kept for crest display |

## Adding New Components

1. Define Tailwind classes in `tailwind.config.ts` under `colors`, `fontFamily`, `borderRadius`, `boxShadow`, `spacing`.
2. Add CSS tokens to `globals.css` under the `:root` layer (same names).
3. Use `var(--token-name)` in inline styles, or add a `.className` to `globals.css` under `@layer components`.
4. For buttons: use `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost` + size variants `.btn-sm`, `.btn-lg`.
5. For cards: use `.card` + `.card-header`, `.card-body`, `.card-footer`.
6. h2 elements: **do not** use Tailwind `text-` classes. Let `h2 { font-size: var(--t-h2); }` in globals.css set the size.