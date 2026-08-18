# API Design Constitution

## Purpose

This document defines backend-wide API principles for CroshFinal.

Feature-level `AGENTS.md` files define the detailed API contract of individual features.

This document establishes the common foundation that all features must follow.

---

## API Style

The backend exposes a REST-oriented HTTP API.

API design should favor:

- resource-oriented URLs
- standard HTTP methods
- standard HTTP status codes
- predictable request/response structures
- explicit validation
- consistent errors

Feature-level documentation may define the exact routes and behavior.

---

## Resource Naming

Resources should use clear, consistent nouns.

Prefer:

`/users`

over:

`/getUsers`

Use plural resource names unless a feature has a strong reason to follow a different established convention.

Nested resources may be used when the relationship is meaningful.

---

## HTTP Methods

Use HTTP methods according to their intended semantics:

- `GET` — retrieve
- `POST` — create or initiate an operation
- `PATCH` — partially update
- `PUT` — replace when replacement semantics are appropriate
- `DELETE` — delete/deactivate when appropriate

Do not use `POST` for ordinary CRUD operations merely because it is convenient.

---

## Status Codes

Use standard HTTP status codes consistently.

At minimum, distinguish appropriately between:

- successful retrieval
- successful creation
- successful update
- successful deletion
- invalid input
- unauthenticated requests
- unauthorized requests
- missing resources
- conflicts
- rate limiting
- unexpected server failures

Exact feature behavior may be defined by feature-level documentation.

---

## Request Validation

Requests containing untrusted input must be validated.

Zod is the standard validation mechanism.

Validation should cover relevant:

- body data
- route parameters
- query parameters
- headers when applicable

Validation errors must produce a consistent API error response.

---

## Response Design

Responses should be predictable and consistent within the API.

Feature-specific response schemas should be defined with the feature.

Do not expose internal database models directly when the API contract should be independent of the database representation.

API responses should contain only data appropriate for the consumer.

---

## Error Responses

API errors must use a consistent structure.

Errors should provide enough information for clients to respond appropriately without exposing sensitive internal details.

Development diagnostics must not automatically become production API output.

Internal errors should be logged server-side and represented externally as appropriate.

---

## Pagination

Pagination is a feature-level decision unless a future backend-wide pagination standard is established.

Features returning potentially large collections should define bounded retrieval behavior.

Do not create unbounded list endpoints for datasets that can grow significantly.

Feature-level documentation must specify pagination behavior when pagination is required.

---

## Filtering, Sorting, and Searching

Filtering, sorting, and searching are feature-level API concerns.

When supported, their parameters must:

- be explicitly documented
- be validated
- have predictable semantics
- avoid allowing uncontrolled database queries

Do not expose arbitrary database fields as query parameters without explicit design.

---

## Idempotency

Operations with retry-sensitive side effects should consider idempotency.

Particularly important for:

- payments
- external service calls
- resource creation
- webhook processing
- other operations that may be retried

Feature-level documentation should define idempotency behavior where required.

---

## Authentication

Authenticated endpoints must enforce authentication on the backend.

The frontend must not be treated as an authorization boundary.

Authentication behavior is defined by `security-rules.md`.

---

## Authorization

Authentication alone does not imply permission.

Endpoints performing protected operations must enforce appropriate authorization.

Authorization rules should be defined by the feature or domain that owns the resource.

---

## API Versioning

API versioning should be introduced when there is a genuine compatibility requirement.

Do not add versioning complexity prematurely.

Once a versioning strategy is adopted, breaking changes must follow that strategy.

---

## Backward Compatibility

Changes to established API contracts should consider existing consumers.

Avoid unnecessary breaking changes.

When a breaking change is required, document its impact and migration path.

---

## File Uploads

File upload endpoints must follow the security requirements defined in `security-rules.md`.

Feature-level documentation must define:

- accepted file types
- size limits
- storage behavior
- processing behavior
- access rules

---

## API Documentation

Public or important API behavior should be documented close to the feature that owns it.

Do not duplicate feature-specific endpoint definitions in this backend-wide document.

---

## Feature-Level API Rules

A feature's `AGENTS.md` may define:

- exact routes
- request schemas
- response schemas
- pagination
- filtering
- sorting
- authorization
- idempotency
- endpoint-specific status codes

These rules must remain compatible with this document and higher-level project rules.
