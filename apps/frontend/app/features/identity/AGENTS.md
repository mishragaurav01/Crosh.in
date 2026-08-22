# AGENTS.md — Feature: Identity (Frontend)

## Purpose

Delta-only spec for the frontend `identity` feature: Login, Sign Up, and OTP
Verification screens. Does not restate frontend architecture or design tokens
— those are governed by `apps/frontend/constitution/*.md`. This file
covers what's specific to these three screens.

**Tier 1 feature** (per `constitution/domain-map.md`).

Load alongside this file: `apps/frontend/constitution/frontend-architecture.md`,
`apps/frontend/constitution/design-system.md`, and the backend's
`apps/backend/src/features/identity/AGENTS.md` (Endpoints section is the API
contract these screens integrate against).

---

## Scope

Three screens, each with mobile and desktop layouts:

| Screen | Figma node (mobile) | Figma node (desktop) |
|---|---|---|
| Login | `18:136` | `18:58` |
| Sign Up | `18:186` | `18:261` |
| OTP Verification | `18:2` | `18:355` |

Signup and Login share the same form (email/phone input → "Send OTP") since
the backend treats them as one flow — see backend `identity/AGENTS.md` Scope.
The only meaningful UI difference between the two screens is copy ("Welcome
Back" vs. a signup-oriented heading) and the footer link direction.

**Out of scope for this pass:** OAuth. The Figma designs include a "Continue
with Google" button, but backend OAuth support is deferred (see backend
`identity/AGENTS.md`). **Decision: hide the OAuth button and its divider for
this pass** rather than ship a non-functional control. Structure the component
so it can be un-hidden later without a rebuild — don't delete the markup,
gate it behind a flag or comment marking it as pending backend support.

---

## Layout Notes (apply to all three screens)

- **No storefront chrome.** These screens use the transactional header pattern
  (see `design-system.md` → Component Tokens) — simplified top bar with
  logo + back/close button, no primary nav, no bottom nav bar, no footer nav
  links (the desktop screens do keep a minimal legal-links footer, that's
  fine — it's not the storefront footer).
- **Mobile:** single-column, stacked layout. Hero/lifestyle image sits above
  the form, not beside it.
- **Desktop:** split-pane layout — left panel is a full-height lifestyle image
  with overlay caption text, right panel holds the centered form (max-width
  400px). **Use a placeholder image for the left panel for now** — the actual
  photography asset isn't finalized; build the layout to accept a real image
  later without restructuring.
- **OTP screen specifically:** 6 separate digit inputs (not a single text
  field), auto-advance focus to the next box on input, resend-code button
  with a visible countdown timer (starts at the backend's configured cooldown
  — currently 60s per `constitution/decisions.md`), disabled/greyed until the
  cooldown expires.

---

## Component Breakdown

- `AuthLayout` — shared wrapper handling the transactional header + desktop
  split-pane / mobile stacked variants. Both Login and Sign Up use this.
- `AuthForm` — email/phone input + "Send OTP" submit button. Shared between
  Login and Sign Up (same fields, different heading copy).
- `OtpInputGroup` — 6-box digit input with auto-advance and paste support.
- `ResendCodeButton` — countdown-gated action; disabled state shows remaining
  seconds, enabled state is a clickable link.

Check for existing shared primitives (Button, Input) before building new ones
— these screens should reuse the design system's input/button treatment, not
introduce screen-specific variants.

---

## API Integration

Calls the backend endpoints defined in `apps/backend/src/features/identity/AGENTS.md`:

- Login/Signup form submit → `POST /api/auth/otp/request`
- OTP screen submit → `POST /api/auth/otp/verify`
- On successful verify → redirect to the intended destination (home, or
  wherever the user was headed before being prompted to auth)
- App shell / layout-level check → `GET /api/auth/me` to determine auth state
- Logout action (wherever it lives in the app, e.g. account menu) →
  `POST /api/auth/logout`

Handle the backend's error codes explicitly in the UI, don't just show a
generic error:

| Backend error code | UI behavior |
|---|---|
| `OTP_INVALID` | Inline error under the OTP input: "Incorrect code, try again" |
| `OTP_EXPIRED` | Prompt to request a new code; disable the verify button |
| `OTP_MAX_ATTEMPTS` | Force a new OTP request; clear the input |
| `OTP_RATE_LIMITED` | Explain the cooldown, don't let them retry immediately |
| `UNAUTHENTICATED` (from `/me`) | Treat as logged-out state, no error shown |

All requests include the session cookie automatically (browser default for
same-site/credentialed requests) — do not manually attach a token. State-
changing requests (`/otp/verify`, `/logout`) need the CSRF token the backend
requires per its Security Notes — confirm the CSRF mechanism (header vs. body
field) with the backend implementation before wiring this up.

---

## Security Notes (frontend-specific)

- Never store the session identifier in `localStorage`/`sessionStorage` — it's
  an httpOnly cookie, the frontend never touches it directly. Don't add token
  management code that assumes otherwise.
- The OTP input is the one place on this screen where autocomplete should be
  tuned deliberately — use `autocomplete="one-time-code"` so mobile browsers/
  SMS autofill can populate it correctly.
- Client-side validation (email/phone format) is UX only — the backend's Zod
  validation is authoritative, per `frontend-architecture.md`.

---

## Escalation

Ask before proceeding if: real photography for the desktop left panel becomes
available and needs sourcing/optimization decisions, the CSRF mechanism isn't
clear from the backend implementation, or OAuth needs to be unhidden before
backend support actually lands.

---

## Definition of Done (feature-specific, in addition to frontend `AGENTS.md`)

- [ ] Login, Sign Up, OTP screens implemented for both mobile and desktop
      breakpoints, matching the Figma layout notes above.
- [ ] OAuth button hidden but not deleted from the component structure.
- [ ] Desktop left panel uses a placeholder image, structured to swap in a
      real asset later without layout changes.
- [ ] All five backend error codes produce distinct, correct UI behavior —
      verified against a running backend, not assumed.
- [ ] No hardcoded colors — confirmed every value traces to
      `design-system.md`, including the resolved `focus-ring` and `blush`
      tokens (not the Figma source's raw `#2563eb` / `#f7d8d8`).
- [ ] OTP input has `autocomplete="one-time-code"`.
- [ ] Resend button countdown matches the backend's actual cooldown value.
