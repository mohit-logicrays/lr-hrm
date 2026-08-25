# LR Design System — DESIGN.md

> This document is the **single source of truth** for all visual design in the LR frontend.
> Any AI coding agent or developer building UI must follow it exactly. Do not invent
> unrelated colors, logos, gradients, or decorative effects.

---

## 1. Overview

The supplied LR logo is the primary visual reference. The identity is built around:

- Strong black typography and structure
- Distinctive red brand accents (`#C92F2F`)
- Clean white/light surfaces
- Deep near-black dark-mode surfaces
- High contrast
- Minimal, modern interfaces
- Generous spacing
- Subtle borders and elevation
- Clear interaction states

The design should feel professional, modern, confident, minimal, and premium.

Do not introduce unrelated colors, excessive gradients, glassmorphism, neon effects,
or overly decorative UI unless explicitly required by a specific product feature.

---

## 2. Brand Identity

### 2.1 Logo

Use the supplied LR logo as the canonical brand asset.

The logo consists of:

- A black geometric L-like shape
- A red stylized R
- Red accent strokes around the upper-right area

**DO:**

- Preserve the original aspect ratio.
- Preserve the original red/black relationship.
- Maintain sufficient whitespace around the logo.
- Use the logo consistently across navigation, authentication, marketing, and application surfaces.
- Use a reversed/light version for dark backgrounds when necessary.

**DO NOT:**

- Stretch, rotate, skew, crop, or outline the logo.
- Add gradients, glow effects, or drop shadows.
- Change the red into arbitrary colors.
- Place the logo on visually noisy backgrounds.

**Minimum size (digital):** 24px height.
**Preferred application header:** 28–32px.
**Marketing hero:** 36–48px depending on layout.

**Clear space:** at least 25% of logo height on every side.

---

## 3. Visual Personality

| Trait | Meaning |
|---|---|
| Confidence | Strong typography, decisive buttons, clear hierarchy |
| Simplicity | Simple layouts over visually complicated compositions |
| Precision | Consistent spacing, alignment, component dimensions, typography |
| Modernity | Subtle radius, restrained shadows, clean surfaces, smooth micro-interactions |
| Brand recognition | Red used strategically, not everywhere |

---

## 4. Color System

Use semantic design tokens instead of hard-coded colors.

### 4.1 Brand colors

| Token | Light | Dark |
|---|---|---|
| Brand | `#C92F2F` | `#E04444` |
| Brand Hover | `#A92424` | `#F05A5A` |
| Brand Active | `#8F1E1E` | `#C93434` |
| Brand Soft | `#FBE7E7` | `#3A1D1D` |

Brand red is used for: primary buttons, active states, important links, selected
navigation, brand accents, progress indicators, and important highlights.

### 5. Light theme tokens

| Token | Value |
|---|---|
| Background | `#FFFFFF` |
| Surface | `#FFFFFF` |
| Surface Subtle | `#F7F7F8` |
| Surface Muted | `#F0F1F2` |
| Text Primary | `#111111` |
| Text Secondary | `#525252` |
| Text Tertiary | `#737373` |
| Border | `#E2E2E3` |
| Border Strong | `#C8C8CA` |
| Focus | `#C92F2F` |

Light theme principles: clean, bright, premium, spacious, editorial, high contrast.
White remains the dominant canvas color. Avoid excessive gray backgrounds.

### 6. Dark theme tokens

Dark mode is designed independently — never by simple inversion.

| Token | Value |
|---|---|
| Background | `#0D0D0E` |
| Surface | `#151516` |
| Surface Subtle | `#1D1D1F` |
| Surface Muted | `#262629` |
| Text Primary | `#F5F5F5` |
| Text Secondary | `#B8B8BA` |
| Text Tertiary | `#8C8C90` |
| Border | `#303034` |
| Border Strong | `#47474C` |
| Focus | `#F05A5A` |

Dark theme principles:

- Use layered surfaces: Background → Surface → Surface Subtle → Surface Muted.
- Prefer borders and surface contrast over shadows.
- Red becomes slightly brighter for visibility.
- Never put red text on dark-red backgrounds.

---

## 7. Typography

Primary font: **Inter**
Fallback: `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

| Style | Size | Weight | Line Height |
|---|---|---|---|
| Display | 48px | 700 | 1.05 |
| H1 | 36px | 700 | 1.15 |
| H2 | 30px | 700 | 1.20 |
| H3 | 24px | 700 | 1.25 |
| H4 | 20px | 600 | 1.30 |
| Body Large | 18px | 400 | 1.55 |
| Body | 16px | 400 | 1.50 |
| Body Small | 14px | 400 | 1.45 |
| Caption | 12px | 500 | 1.40 |
| Button | 14–16px | 600 | 1.00 |

Rules:

- Strong weights for headings, regular weight for body.
- Avoid excessive font-weight variation.
- Sentence case for UI labels; no extensive all-caps.
- Headings → text-primary. Supporting content → text-secondary.

## 8. Spacing System

4px grid: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`

```css
--space-1: 4px;   --space-6: 24px;  --space-16: 64px;
--space-2: 8px;   --space-8: 32px;  --space-20: 80px;
--space-3: 12px;  --space-10: 40px; --space-24: 96px;
--space-4: 16px;  --space-12: 48px;
--space-5: 20px;
```

Prefer: 8px tight · 16px standard · 24px component · 32px section · 48px+ major separation.

## 9. Layout

Maximum widths:

| Context | Width |
|---|---|
| Small content | 640px |
| Standard content | 960px |
| Wide content | 1200px |
| Marketing maximum | 1280px |

Page padding: Desktop 24px · Mobile 16px.

Grid: Desktop 12 columns / 24px gutter · Tablet 8 / 20px · Mobile 4 / 16px.

## 10. Responsive Breakpoints (mobile-first)

```
sm 640px · md 768px · lg 1024px · xl 1280px · 2xl 1536px
```

Components must reflow naturally — never simply shrink desktop layouts.

## 11. Border Radius

| Token | Value | Usage |
|---|---|---|
| Small | 6px | small elements |
| Medium | 10px | inputs, buttons |
| Large | 14px | cards |
| XL | 14–20px | dialogs |
| Full | 9999px | pills, avatars (sparingly) |

## 12. Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.10);
--shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.14);
```

In dark mode reduce shadow intensity; prefer borders and surface contrast.

## 13–14. Buttons

Variants:

- **Primary** — bg Brand Red, white text. Hover `#A92424`, Active `#8F1E1E`, disabled = muted surface.
- **Secondary** — Surface bg, Border border, Primary text. Hover: Surface Subtle.
- **Ghost** — transparent bg, Primary text. Hover: Surface Subtle.
- **Destructive** — semantic error red only, never brand red automatically.

Sizes: sm 32px · md 40px · lg 48px. Minimum horizontal padding 16px.
Button text: 14–16px, weight 600.

## 15. Form Controls

Inputs/selects/textareas share one system:

- Height 40–44px, 1px border, radius 10px, Surface background.
- Focus: visible ring in Brand (~2px).
- Error: error border + message + optional icon. Never color alone.
- Disabled: Surface Muted background, Tertiary text.
- Labels always visible — placeholders are never the only label.

## 16. Cards

Default card: Surface background, 1px Border, radius 14px, padding 20–24px.
Cards communicate grouping and hierarchy. Avoid cards nested inside cards.
Featured cards may use Brand Soft background or a subtle red accent.

## 17. Navigation

Desktop nav contains: Logo · primary navigation · secondary actions · primary CTA.
Normal items use Text Secondary; active items use Text Primary plus one brand accent
(red underline, indicator, icon, OR tint — not all at once).
Mobile header stays compact: Logo + Menu.

## 18. Icons

One consistent family: geometric, minimal, outline-based, consistent stroke width.
Sizes: 16 / 20 / 24 / 32px. Stroke 1.75–2px. Icons support text, don't replace it.

## 19. Interaction States

Every interactive component supports: Default, Hover, Focus, Active, Disabled,
Loading, Error, Success. Focus must always be keyboard-visible.

Recommended transition:

```css
transition:
  color 150ms ease,
  background-color 150ms ease,
  border-color 150ms ease,
  box-shadow 150ms ease,
  transform 150ms ease;
```

## 20. Motion

Motion communicates changes rather than decorating.

| Type | Duration |
|---|---|
| Micro interaction | 100–150ms |
| Component | 150–200ms |
| Large transition | 200–300ms |

Avoid excessive bouncing, long animations, constant floating, unnecessary parallax.
Always respect `prefers-reduced-motion`.

## 21. Accessibility

Target WCAG 2.2 AA:

- Normal text ≥ 4.5:1 contrast; large text ≥ 3:1.
- Keyboard-accessible controls with visible focus.
- Proper semantic HTML and logical heading hierarchy.
- Accessible names for icon-only buttons.
- Form labels; errors associated with fields.
- Never communicate information through color alone.
- Support reduced motion.

## 22–23. Theme Architecture

Semantic CSS custom properties with `[data-theme="dark"]` override.
Theme options: Light / Dark / System. Persist manual selection.
See "Implementation Mapping" below for how these live in this codebase.

## 24. Status Colors

Independent from brand color. Always pair status color with an icon/label/message.

| Status | Light | Dark |
|---|---|---|
| Success | `#16803C` | `#39B86A` |
| Warning | `#A15C00` | `#F2B84B` |
| Error | `#B42318` | `#FF6B61` |
| Info | `#1769AA` | `#58A6D8` |

## 25. Content Style

Short, clear, direct, confident, action-oriented.
Prefer: Create · Continue · Save · Review · Manage · Edit · Delete · Retry.
Avoid vague labels like Submit / Click Here when a more specific label exists.

## 26. Marketing Pages

Structure: Header → Hero → Primary CTA → Social proof → Features → Product explanation → Secondary CTA → Footer.
Heroes use large typography, strong whitespace, a clear CTA, restrained red accent.
Avoid overly decorative hero backgrounds.

## 27. Application Pages

App shell:

```
App Shell
├── Sidebar / Navigation
├── Header
├── Page Header
├── Main Content
└── Supporting Actions
```

Consistent page padding, header heights, card spacing, button sizing, form spacing,
empty states, loading states.

## 28. Empty States

Simple icon/illustration + clear title + short explanation + optional primary action.
Example:

> No projects yet
> Create your first project to get started.
> [ Create project ]

Do not over-design empty states.

## 29. Loading States

Prefer skeleton loading for content-heavy pages.
Skeleton colors: Light `#F0F1F2` · Dark `#262629`.
Avoid full-screen spinners except for app initialization.

## 30. Error States

Clear, specific, actionable:

> Something went wrong
> We couldn't load your projects.
> [ Try again ]

Avoid technical error messages unless the audience is technical.

## 31. Do / Don't

**DO**

- Use black, white, and red as the core identity.
- Keep layouts clean; use red strategically.
- Use consistent spacing and strong typography.
- Build a proper dark theme; use subtle borders and restrained shadows.
- Keep components accessible; design mobile-first.

**DON'T**

- Random accent colors, overused red, unexplained gradients.
- Excessive glassmorphism or glowing neon effects.
- Distorted logo, inconsistent radii, mixed icon styles.
- Hidden focus states, dark mode via color inversion.

## 34. Final Design Principle

Hierarchy: **Logo → Typography → Neutral surfaces → Red emphasis → Interaction**

Red creates recognition. Neutrals create usability. Typography creates hierarchy.
Spacing creates clarity. Interactions feel fast, subtle, intentional.
The result must look premium, modern, clean, confident, and unmistakably LR.

---

## Implementation Mapping (this codebase)

Stack: **Next.js (App Router) + Tailwind CSS v4 + Framer Motion + Lenis smooth scroll.**

### Tokens

All tokens live in `frontend/src/app/globals.css`:

- Static brand/status/radius/shadow tokens in the Tailwind v4 `@theme` block
  (usable as utilities: `bg-brand`, `text-text-primary`, `border-border-base`, `rounded-md`, `shadow-md`, …).
- Theme-dependent tokens (`--bg`, `--surface`, `--text-*`, `--border-*`, `--focus`)
  are defined on `:root` and overridden under `[data-theme="dark"]`, exposed to
  Tailwind via nested `@theme inline`.

### Smooth scroll

Lenis is initialized once in `src/providers/SmoothScrollProvider.tsx`.
It disables itself when `prefers-reduced-motion: reduce` is set.

### Motion

Framer Motion variants should stay subtle: fade/slide ≤ 16px, duration ≤ 300ms,
`easeOut`. Respect reduced motion.

### Component / layout based approach

```
frontend/src/
├── app/                    # Routes (App Router pages/layouts)
├── components/
│   ├── ui/                 # Reusable primitives (Button, Logo, Input, Card…)
│   └── layouts/            # Structural components (Header, Footer, Section…)
└── providers/              # Client providers (SmoothScrollProvider…)
```

Rules for agents building on this codebase:

- Compose pages from `layouts/*` wrappers and `ui/*` primitives — no ad-hoc styling of structural elements inside pages.
- Never hard-code hex values in components; always use token utilities.
- New interactive components must implement all states from section 19.
- Test both light and dark themes before considering work complete.
