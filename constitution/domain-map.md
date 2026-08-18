# Domain Map — Repository Level

## Purpose

Defines Crosh's business domains and how they map to feature folders in
`apps/backend/src/features/` and `apps/frontend/src/features/`. This is a
different concern from `constitution/architecture.md`, which maps monorepo
*packages* (apps/backend, apps/frontend, packages/db). This document maps
*business domains*.

Load this when: deciding where a piece of business logic belongs, or whether
something needs its own feature folder.

---

## Domains

```
Crosh
├── Identity          → feature: identity
│   ├── User
│   ├── Authentication
│   ├── Sessions
│   └── OAuth / OTP
│
├── Catalog            → feature: catalog
│   ├── Category
│   ├── Collection
│   ├── Product
│   └── Variant
│
├── Inventory           → feature: inventory
│   └── Stock management
│
├── Wishlist            → feature: wishlist
│
├── Cart                → feature: cart
│
├── Checkout            → conceptual grouping only, NOT a feature folder
│   ├── Address          → belongs to: order (or identity, if reused as user profile address — decide on first implementation, record in decisions.md)
│   ├── Order            → feature: order
│   └── Payment           → feature: payment
│
├── Fulfillment
│   ├── Shipment         → feature: shipment
│   └── Order tracking    → feature: order (tracking status is order state, not a separate domain)
│
├── Notifications        → feature: notifications
│   ├── Email
│   └── In-app notifications
│
└── Admin                → feature: admin (frontend-heavy; backend admin endpoints
                            live alongside the domain they operate on, not in a
                            separate "admin service")
```

---

## Feature Folder Decisions

- **Checkout is not a feature folder.** It's the conceptual flow that spans
  `order` and `payment`. Keep `order` and `payment` as separate, independently
  testable feature folders — this isolates payment's blast radius from cart/order
  logic and keeps PCI-relevant code contained to one module.
- **Address** is owned by whichever feature actually persists it first
  (likely `order`, for shipping/billing snapshots — see the shipping-address
  snapshotting decision already made for order line items). If `identity` later
  needs saved user addresses, that's a second, related but distinct concern —
  don't assume one implementation covers both without checking.
- **Fulfillment's "order tracking"** is status/state on the `order` domain, not
  a separate feature. `shipment` owns carrier/tracking-number/delivery-event
  data; `order` owns the order-level status derived from it.
- **Admin** does not get its own backend service layer. Admin-specific backend
  endpoints (e.g. `PATCH /admin/products/:id`) live inside the feature they
  operate on (`catalog`, `inventory`, `order`, etc.) with their own authorization
  rules, not inside a monolithic `admin` backend module. The frontend `admin`
  feature folder can be a single dashboard app that consumes those endpoints.
- **Notifications** is a feature folder because it has its own delivery logic
  (email templates, in-app notification records) even though it's triggered by
  events from other domains — not because it owns primary business data.

---

## Feature Tiers

Based on risk, not just domain complexity — see root `AGENTS.md` context
loading table for how this affects doc depth per feature.

**Tier 1 — full spec (AGENTS.md + plan.md + task.md):**
- `identity` — auth, sessions, OTP/OAuth
- `payment` — money, PCI boundary, third-party processor integration

**Tier 2 — lighter (AGENTS.md doubles as plan; task.md only when implementing):**
- `catalog`, `inventory`, `wishlist`, `cart`, `order`, `shipment`, `notifications`

**Tier 3 — frontend-only, thin:**
- `admin` — dashboard composing other domains' existing endpoints; promote to
  Tier 2 if it grows real business logic of its own (unlikely, but re-evaluate
  if it happens).

---

## Changes

Update this map when a domain is added, split, or reassigned to a different
feature folder. This should stay in sync with the actual `src/features/`
directories in both apps — a mismatch here is a documentation bug, not just an
inconvenience, since agents rely on this to decide where code belongs.
