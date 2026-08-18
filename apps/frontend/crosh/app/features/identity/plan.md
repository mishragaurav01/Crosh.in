# plan.md — Identity (Frontend)

Sequenced implementation plan. Build shared components before screens; build
screens before wiring real API calls, so layout issues and integration issues
don't get debugged simultaneously.

---

## Phase 1 — Shared Components

1. `AuthLayout` — transactional header + responsive split-pane/stacked body.
2. `AuthForm` — email/phone input + submit button, reused by Login/Sign Up.
3. `OtpInputGroup` — 6-box digit input, auto-advance, paste support,
   `autocomplete="one-time-code"`.
4. `ResendCodeButton` — countdown-gated action button.

Verify each in isolation (e.g. a quick local test route or Storybook-equivalent
if one exists) before assembling full screens — catch layout bugs at the
component level, not the screen level.

## Phase 2 — Screens (static, no API wiring yet)

1. Login screen (mobile + desktop), using `AuthLayout` + `AuthForm`.
2. Sign Up screen (mobile + desktop) — same components, different copy.
3. OTP Verification screen (mobile + desktop), using `OtpInputGroup` +
   `ResendCodeButton`.
4. Confirm against Figma nodes listed in `AGENTS.md` at both breakpoints
   before moving on — pixel-perfect isn't required, but layout structure,
   spacing, and token usage should match.

## Phase 3 — API Integration

1. Confirm the backend identity endpoints are implemented and manually
   verified (backend `plan.md` Phase 6) before starting this phase — don't
   build against an unstable API.
2. Wire `AuthForm` submit → `POST /api/auth/otp/request`.
3. Wire OTP screen submit → `POST /api/auth/otp/verify`.
4. Implement the error-code → UI-behavior mapping from `AGENTS.md`.
5. Confirm CSRF mechanism with the backend implementation (header vs. body
   field) and wire it into both state-changing requests.
6. Wire `GET /api/auth/me` at the app-shell level for auth-state awareness.
7. Wire logout action to `POST /api/auth/logout`.

## Phase 4 — Verification

1. Manually trigger each of the five backend error codes and confirm the UI
   behavior matches the table in `AGENTS.md`.
2. Confirm session cookie round-trips correctly (login → refresh page → still
   authenticated via `/me`).
3. Confirm resend countdown matches the backend's actual configured cooldown.
4. Run `turbo test --filter=frontend`, `turbo typecheck --filter=frontend`,
   `turbo lint --filter=frontend`.
5. Visual check at mobile and desktop breakpoints against the Figma reference.

## Open Items

- Real photography for the desktop left panel — placeholder only for now.
- CSRF mechanism needs confirming against actual backend implementation
  before Phase 3 step 5.
