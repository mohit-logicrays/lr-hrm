# Logic Rays Technology – HRM Portal

## Design System

This document defines the complete design system for the HRM Portal. All tokens are implemented as CSS custom properties in `globals.css` and consumed via Tailwind CSS utilities.

---

## Brand Identity

| Attribute | Value |
|-----------|-------|
| Primary Color | `#E11D48` (Rose-600) |
| Secondary Color | `#111827` (Gray-900) |
| Brand Character | Professional, clean, modern |

---

## Colors

### Primary (Logo Red)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#E11D48` | Buttons, links, active states |
| `--color-primary-hover` | `#BE123C` | Hover state |
| `--color-primary-active` | `#9F1239` | Active/pressed state |
| `--color-primary-light` | `#FFE4E6` | Light backgrounds, badges |
| `--color-primary-lighter` | `#FFF1F2` | Very light tints |
| `--color-primary-dark` | `#881337` | Dark text on light bg |

### Secondary (Logo Black)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-secondary` | `#111827` | Sidebar, dark sections |
| `--color-secondary-soft` | `#1F2937` | Subtle dark elements |
| `--color-secondary-light` | `#374151` | Borders on dark bg |

### Neutrals

| Token | Value | Tailwind Equivalent |
|-------|-------|---------------------|
| `--color-neutral-50` | `#F9FAFB` | gray-50 |
| `--color-neutral-100` | `#F3F4F6` | gray-100 |
| `--color-neutral-200` | `#E5E7EB` | gray-200 |
| `--color-neutral-300` | `#D1D5DB` | gray-300 |
| `--color-neutral-400` | `#9CA3AF` | gray-400 |
| `--color-neutral-500` | `#6B7280` | gray-500 |
| `--color-neutral-600` | `#4B5563` | gray-600 |
| `--color-neutral-700` | `#374151` | gray-700 |
| `--color-neutral-800` | `#1F2937` | gray-800 |
| `--color-neutral-900` | `#111827` | gray-900 |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#059669` | Success states, approvals |
| `--color-success-light` | `#D1FAE5` | Success backgrounds |
| `--color-warning` | `#D97706` | Warnings, pending states |
| `--color-warning-light` | `#FEF3C7` | Warning backgrounds |
| `--color-danger` | `#E11D48` | Errors, destructive actions |
| `--color-danger-light` | `#FFE4E6` | Error backgrounds |
| `--color-info` | `#0EA5E9` | Informational elements |
| `--color-info-light` | `#E0F2FE` | Info backgrounds |

### Backgrounds & Surfaces

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#F9FAFB` | Page background |
| `--color-surface` | `#FFFFFF` | Card/panel background |
| `--color-surface-elevated` | `#FFFFFF` | Elevated elements |
| `--color-border` | `#E5E7EB` | Default borders |
| `--color-border-strong` | `#D1D5DB` | Emphasized borders |

### Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text-primary` | `#111827` | Headings, primary text |
| `--color-text-secondary` | `#4B5563` | Body text, descriptions |
| `--color-text-muted` | `#6B7280` | Placeholders, hints |
| `--color-text-inverse` | `#FFFFFF` | Text on dark backgrounds |
| `--color-text-link` | `#E11D48` | Links |

---

## Typography

### Font Families

| Token | Fonts | Usage |
|-------|-------|-------|
| `--font-sans` | Inter, Plus Jakarta Sans, system-ui | Body text, UI |
| `--font-mono` | JetBrains Mono, Fira Code, ui-monospace | Code, technical data |

### Type Scale

| Token | Size | px | Usage |
|-------|------|-----|-------|
| `--text-xs` | 0.75rem | 12px | Captions, badges |
| `--text-sm` | 0.875rem | 14px | Labels, small text |
| `--text-base` | 1rem | 16px | Body text (base) |
| `--text-lg` | 1.125rem | 18px | Large body, h5 |
| `--text-xl` | 1.25rem | 20px | Subheadings, h4 |
| `--text-2xl` | 1.5rem | 24px | Section headers, h3 |
| `--text-3xl` | 1.875rem | 30px | Page titles, h2 |
| `--text-4xl` | 2.25rem | 36px | Hero text, h1 |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-normal` | 400 | Body text |
| `--font-medium` | 500 | Labels, emphasis |
| `--font-semibold` | 600 | Subheadings, table headers |
| `--font-bold` | 700 | Headings, strong emphasis |

---

## Spacing

| Token | Value | px |
|-------|-------|-----|
| `--space-1` | 0.25rem | 4px |
| `--space-2` | 0.5rem | 8px |
| `--space-3` | 0.75rem | 12px |
| `--space-4` | 1rem | 16px |
| `--space-5` | 1.25rem | 20px |
| `--space-6` | 1.5rem | 24px |
| `--space-8` | 2rem | 32px |
| `--space-10` | 2.5rem | 40px |
| `--space-12` | 3rem | 48px |
| `--space-16` | 4rem | 64px |

---

## Border Radius

| Token | Value | px | Usage |
|-------|-------|-----|-------|
| `--radius-sm` | 0.25rem | 4px | Small elements |
| `--radius-md` | 0.375rem | 6px | Inputs, buttons |
| `--radius-lg` | 0.5rem | 8px | Cards, dropdowns |
| `--radius-xl` | 0.75rem | 12px | Modals, large cards |
| `--radius-2xl` | 1rem | 16px | Hero sections |
| `--radius-full` | 9999px | — | Pills, avatars |

---

## Shadows

| Token | Usage |
|-------|-------|
| `--shadow-sm` | Subtle elevation (cards at rest) |
| `--shadow-md` | Medium elevation (dropdowns, popovers) |
| `--shadow-lg` | High elevation (modals, dialogs) |
| `--shadow-xl` | Maximum elevation (tooltips, toast) |

---

## Transitions

| Token | Duration | Usage |
|-------|----------|-------|
| `--transition-fast` | 150ms ease | Hover states, focus rings |
| `--transition-base` | 200ms ease | Default transitions |
| `--transition-slow` | 300ms ease | Page transitions, modals |

---

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-dropdown` | 1000 | Dropdown menus |
| `--z-sticky` | 1020 | Sticky headers |
| `--z-fixed` | 1030 | Fixed elements |
| `--z-modal-backdrop` | 1040 | Modal overlays |
| `--z-modal` | 1050 | Modal content |
| `--z-popover` | 1060 | Popovers |
| `--z-tooltip` | 1070 | Tooltips |

---

## Dark Mode

Dark mode is activated via `data-theme="dark"` on `<html>`.

| Token | Light | Dark |
|-------|-------|------|
| `--color-bg` | `#F9FAFB` | `#0F172A` |
| `--color-surface` | `#FFFFFF` | `#1E293B` |
| `--color-surface-elevated` | `#FFFFFF` | `#334155` |
| `--color-border` | `#E5E7EB` | `#334155` |
| `--color-border-strong` | `#D1D5DB` | `#475569` |
| `--color-text-primary` | `#111827` | `#F8FAFC` |
| `--color-text-secondary` | `#4B5563` | `#CBD5E1` |
| `--color-text-muted` | `#6B7280` | `#94A3B8` |
| `--color-text-inverse` | `#FFFFFF` | `#0F172A` |
| `--color-primary-light` | `#FFE4E6` | `#4C0519` |
| `--color-primary-lighter` | `#FFF1F2` | `#3F0A1A` |

---

## Components

### Buttons

| Class | Description |
|-------|-------------|
| `.btn` | Base button |
| `.btn-primary` | Primary action (red bg) |
| `.btn-secondary` | Outline style |
| `.btn-ghost` | Transparent, text only |
| `.btn-danger` | Destructive action |
| `.btn-sm` | Small size |
| `.btn-lg` | Large size |

### Cards

| Class | Description |
|-------|-------------|
| `.card` | Card container |
| `.card-header` | Card top section |
| `.card-body` | Card content area |
| `.card-footer` | Card bottom section |

### Badges

| Class | Description |
|-------|-------------|
| `.badge` | Base pill |
| `.badge-primary` | Primary (red) |
| `.badge-success` | Success (green) |
| `.badge-warning` | Warning (amber) |
| `.badge-danger` | Danger (red) |
| `.badge-info` | Info (blue) |
| `.badge-neutral` | Neutral (gray) |

---

## File Structure

```
frontend/
├── src/
│   └── app/
│       ├── globals.css          # All design tokens + Tailwind config
│       └── layout.tsx           # Font loading (Inter, Plus Jakarta Sans, JetBrains Mono)
├── DESIGN.md                    # This file
└── tailwind.config.ts           # Tailwind theme extension (if needed)
```
