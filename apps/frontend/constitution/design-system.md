# Design System Constitution

## Purpose

Canonical source for Crosh.in's visual tokens. Load this whenever a task touches
color, typography, or spacing — never hardcode a hex/font value inline when a
token exists here.

**Source of truth:** extracted directly from the Figma file
(`3LnzB5a1RwpoQrYoOsumyH`), Home page frame, 2026-08-18. Values below are real,
not approximated from a screenshot. As each additional screen is pulled from
Figma for implementation, cross-check its colors/type against this table before
adding anything new — most screens should reuse these tokens, not introduce more.

This file must mirror `tailwind.config` exactly. A mismatch is a bug — add new
tokens here first, then to `tailwind.config`, never the reverse.

---

## Color Tokens

### Brand

| Token | Value | Usage |
|---|---|---|
| `mauve-brown` | `#705959` | Primary brand color — logo, headings, primary buttons, active states |
| `blush` | `#fadbdb` | Accent — hero CTA button background |
| `sage` | `#d7e2db` | Secondary accent — newsletter section background |
| `sage-dark` | `#56615b` | Darker sage — outline buttons, borders on sage-adjacent sections |
| `sage-muted` | `#5a6560` | Muted sage-gray — body copy on sage backgrounds (often at 80% opacity: `rgba(90,101,96,0.8)`) |

### Neutrals / Backgrounds

| Token | Value | Usage |
|---|---|---|
| `cream` | `#fff8f7` | Primary page background, nav bar background |
| `cream-alt` | `#f9f2f1` | Secondary card/section background (brand story teaser, footer) |
| `border-soft` | `#ede7e6` | Border on circular collection thumbnails |
| `dot-inactive` | `#e8e1e0` | Inactive carousel indicator dots |
| `white` | `#ffffff` | Testimonial card background, text on filled brand buttons |

### Text

| Token | Value | Usage |
|---|---|---|
| `text-primary` | `#1d1b1b` | Product names, testimonial quotes — primary dark text |
| `text-secondary` | `#4f4444` | Prices, nav labels, footer links — secondary body text |
| `text-nav-active` | `#745d5d` | Active bottom-nav label, desktop auth button text |
| `text-placeholder` | `#6b7280` | Input placeholder text (standard gray, not brand-specific) |
| `text-muted-sage` | `#3f4944` | Desktop top-nav links, footer copyright — very close to `sage-dark`; treat as the same family, don't add further near-duplicate tokens without checking here first |

### Interactive States

| Token | Value | Usage |
|---|---|---|
| `focus-ring` | `#705959` (mauve-brown) | Input focus ring — Figma source used a default blue (`#2563eb`); resolved to brand color per decision, do not reintroduce the blue |

*(Confirm no additional colors appear on other screens before treating this list
as complete — covers Home + Identity auth screens so far.)*

**Color resolution rule:** if a newly pulled screen contains a color within a
few hex values of an existing token (e.g. `#f7d8d8` vs. `blush` `#fadbdb`),
treat it as the existing token, not a new one, unless there's a clear
deliberate reason for the variant. Figma screens are iterated independently and
accumulate small drift — this file is what stays canonical.

---

## Typography

- Display / headings: **Playfair Display**
- Body / UI: **Inter**

### Observed Scale (from Home page)

| Use | Font | Weight | Size | Line height |
|---|---|---|---|---|
| Hero heading (H1-equivalent) | Playfair Display | Semibold | 32px | 38.4px |
| Logo / wordmark | Playfair Display | Regular | 32px | 38.4px |
| Section heading (H3-equivalent) | Playfair Display | Medium | 24px | 31.2px |
| Card/subsection heading (H4) | Playfair Display | Regular | 16px | 24px |
| Body text | Inter | Regular | 16px | 24px |
| Body text, italic (testimonial) | Inter | Italic | 16px | 24px |
| Nav label | Inter | Semibold | 12px | 16.8px |

Do not introduce a third typeface, or a size/weight combination not listed here,
without updating this table and getting explicit approval — typography changes
are brand-level decisions.

---

## Radius Scale

| Token | Value | Usage |
|---|---|---|
| `radius-pill` | `9999px` | Buttons, nav pills, avatar/collection circles, dots |
| `radius-lg` | `24px` | Cards, hero image container, section blocks |
| `radius-md` | `12px` | Input fields, smaller image containers |

---

## Shadows

| Use | Value |
|---|---|
| Card elevation | `0px 10px 30px -5px rgba(112,89,89,0.08)` (uses brand mauve-brown as shadow tint, not neutral black) |
| Button drop shadow | `0px 1px 1px rgba(0,0,0,0.05)` |
| Bottom nav bar | `0px -4px 10px rgba(0,0,0,0.04)` |

Note the card shadow tints toward the brand color rather than pure black — carry
this through consistently rather than defaulting to a generic gray shadow.

---

## Spacing & Layout

Mobile frame width observed: 390px (iPhone-standard mobile-first design).
Standard page padding: 20px horizontal.
Section gap: 24–48px between major sections.

Until a full spacing audit is done across all screens, default to Tailwind's
standard spacing scale for anything not explicitly observed above — don't invent
one-off values.

---

## Component Tokens

- **Primary button:** `mauve-brown` (#705959) background, white text, `radius-pill`.
- **Accent button (hero CTA):** `blush` (#fadbdb) background, `mauve-brown` text, `radius-pill`.
- **Outline button:** transparent background, `sage-dark` (#56615b) border and text, `radius-pill`.
- **Input field:** `cream` background, `radius-md`, `text-placeholder` gray placeholder.
- **Product card image:** `radius-lg`, favorite/wishlist icon button overlaid top-right with `backdrop-blur` + `rgba(255,255,255,0.8)` background.
- **OTP digit input:** 48x48px, `8px` radius, white/cream background, `#e8e1e0` border default, `focus-ring` (mauve-brown) on active — one box per digit, 6 total.
- **Split auth layout (desktop only):** two-pane, left panel is a full-height rounded-24px lifestyle image with dark gradient overlay and white text caption; right panel is the form, max-width 400px, vertically centered. Mobile uses a single-column stacked layout instead — no split pane below desktop breakpoint.
- **Transactional header (auth screens):** simplified top bar — logo centered, back/close button left, no primary nav links, no bottom nav bar. Distinct from the storefront header/footer used elsewhere.

As more screens are pulled, add new component patterns here rather than letting
each feature reinvent card/button treatment independently.

---

## Changes

This document must stay in sync with `tailwind.config`. When pulling additional
screens from Figma, update this file with any new token discovered — don't let
per-screen values live only in generated component code.
