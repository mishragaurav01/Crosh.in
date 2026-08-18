# Backend Architecture Constitution

## Purpose

This document defines the architecture that applies across the CroshFinal backend.

Feature-specific architecture may be defined in feature-level documentation, but it must remain compatible with these rules.

---

## Architecture Style

The backend is a modular monolith.

The system is organized around business features/modules while remaining within a single backend application.

Do not introduce microservices, distributed services, or service-to-service communication unless explicitly approved as an architectural change.

The architecture should favor:

- clear boundaries
- simple dependencies
- explicit business logic
- testability
- minimal abstraction
- predictable request flow

---

## Core Request Flow

The standard backend request flow is:

`HTTP Request → Middleware → Route → Controller → Service → Database / External Service`

The reverse flow is used to produce the HTTP response.

Each layer has a specific responsibility.

---

## Routes

Routes are responsible for HTTP endpoint registration and routing.

Routes should:

- define HTTP methods and paths
- attach applicable middleware
- connect requests to controllers

Routes must not contain business logic.

---

## Controllers

Controllers are responsible for HTTP-level concerns.

Controllers should:

- receive the request
- work with validated input
- call the appropriate service
- map the result to an HTTP response
- return appropriate HTTP status codes

Controllers must not contain substantial business logic.

Controllers must not become a second service layer.

---

## Services

Services contain application and business logic.

Services are responsible for:

- business rules
- workflows
- coordination between operations
- database operations
- external service coordination
- enforcing application invariants

Services must remain independent of Express request/response objects.

Business logic should not be placed directly inside routes or controllers.

---

## Validation

Input validation is an application boundary concern.

Zod is the standard validation mechanism for backend request data.

Untrusted input must be validated before being used by business logic.

Validation should occur as close to the HTTP boundary as practical.

Feature-specific schemas belong with the feature.

---

## Middleware

Middleware handles cross-cutting HTTP concerns.

Examples include:

- authentication
- authorization
- request logging
- request IDs
- rate limiting
- CORS
- security headers
- centralized error handling

Middleware must not become a dumping ground for feature-specific business logic.

---

## Error Architecture

The backend must use a consistent application error model.

Errors should distinguish between:

- client/input errors
- authentication failures
- authorization failures
- resource-not-found conditions
- business-rule failures
- external-service failures
- unexpected internal failures

Unexpected internal errors must not expose internal implementation details to API consumers.

---

## Feature Modules

Backend code should be organized by business feature.

A feature should own the code directly related to its behavior.

A feature may contain components such as:

- routes
- controllers
- services
- schemas
- types
- tests

The exact internal structure may be defined by feature-level instructions.

Avoid creating large global folders that separate all controllers, services, and schemas from their features unless there is a specific architectural reason.

---

## Dependency Direction

Dependencies should move toward lower-level infrastructure without creating circular dependencies.

Preferred direction:

`HTTP → Application → Infrastructure`

Business logic must not depend on Express-specific details.

Shared infrastructure must not contain feature-specific business rules.

Avoid circular dependencies between feature modules.

---

## Database Boundary

Database access belongs to the backend/database boundary defined by `packages/db`.

Prisma is the standard database abstraction.

The backend does not require a repository layer by default.

Repositories may only be introduced when they provide a meaningful abstraction or solve a concrete architectural problem.

---

## External Services

External services should be isolated behind explicit service boundaries.

Feature business logic should not spread external-provider-specific implementation throughout controllers and routes.

External service failures must be handled explicitly.

Provider-specific details should remain localized where practical.

---

## Configuration

Application configuration must be centralized and validated.

Environment variables should not be accessed arbitrarily throughout business logic.

Configuration should be loaded through the backend's configuration layer.

Secrets must never be hard-coded.

---

## Authentication and Authorization

Authentication establishes user identity.

Authorization determines whether an authenticated identity may perform an action.

Authentication and authorization must not depend on frontend enforcement.

Backend authorization is authoritative.

CroshFinal supports authentication through:

- email + OTP
- OAuth

The detailed security requirements for these mechanisms are defined in `security-rules.md`.

---

## Observability

The backend should provide structured and useful logging.

Logs should help diagnose:

- application failures
- authentication/security events
- external-service failures
- important operational events

Sensitive information must not be logged.

Detailed observability requirements may evolve as the system grows.

---

## Runtime Lifecycle

The backend must handle startup and shutdown predictably.

Application startup should initialize required dependencies before accepting traffic.

The backend should support graceful shutdown so active resources can be released safely.

Health/readiness behavior should be defined as the deployment environment requires.

---

## Architectural Change

Changes to these architectural principles require explicit architectural review.

Agents must not introduce a new architectural pattern merely to solve a local implementation problem.

Prefer the simplest architecture that satisfies the actual requirement.
