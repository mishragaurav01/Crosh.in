# Security Rules Constitution

## Purpose

This document defines the minimum non-negotiable security requirements for the CroshFinal backend.

Feature-level documentation may impose stricter security requirements but must not weaken these rules.

---

## Security Principle

Security must be enforced by the backend.

The frontend is not a trusted security boundary.

Never rely on client-side checks for authentication, authorization, ownership, or sensitive business rules.

Prefer simple, well-understood security mechanisms over unnecessary complexity.

---

## Authentication

CroshFinal supports:

- email + OTP authentication
- OAuth authentication

Authentication establishes the identity of the user.

Authentication state must be validated by the backend for protected operations.

---

## Email + OTP

OTP authentication must:

- use cryptographically secure random values
- have a short expiration period
- have a limited number of verification attempts
- be single-use
- be invalidated after successful verification
- be rate limited
- avoid exposing whether an account exists when such disclosure creates a security risk
- never log OTP values

OTP values must never be stored or exposed unnecessarily in plaintext.

---

## OAuth

OAuth implementation must use established standards and trusted provider libraries where appropriate.

OAuth callback handling must validate the authentication flow and must not trust client-provided identity claims without verification.

OAuth provider tokens and secrets must be protected.

Account linking must require deliberate and secure rules to prevent account takeover.

---

## Authentication Sessions

Authentication sessions/tokens must have:

- appropriate expiration
- secure storage
- revocation/invalidation behavior where required
- protection against theft and replay where applicable

The exact session architecture may be finalized when the authentication implementation is designed.

Do not introduce unnecessary token complexity before it is required.

---

## Authorization

Authorization must be enforced server-side.

The backend must verify that the authenticated user is allowed to perform the requested operation.

Authorization should account for:

- user identity
- resource ownership
- roles
- permissions
- feature-specific policies

Never rely on a user ID supplied by the client to establish ownership without server-side verification.

---

## Input Security

All untrusted input must be validated.

Validation must not be treated as the only security mechanism.

Database queries must use safe parameterized mechanisms provided by Prisma.

Never construct unsafe raw SQL from untrusted input.

---

## Injection Prevention

Protect against:

- SQL injection
- command injection
- path traversal
- XSS where relevant
- unsafe template evaluation
- unsafe dynamic execution

Do not pass untrusted input directly into system commands, dynamic code execution, or unsafe query construction.

---

## Secrets

Secrets must never be:

- hard-coded
- committed to Git
- returned through APIs
- exposed in logs
- included in client-side bundles

Secrets should be provided through the approved environment/configuration mechanism.

---

## Sensitive Data

Collect and store only the sensitive data that is actually required.

Sensitive data must not be exposed through:

- API responses
- logs
- error messages
- analytics
- debugging output

Database and API models should explicitly control which fields are exposed.

---

## Passwords

If passwords are introduced in the future, they must never be stored in plaintext.

Use a modern password hashing algorithm with appropriate configuration.

Password authentication is not part of the current primary authentication flow unless explicitly introduced later.

---

## Rate Limiting

Security-sensitive operations must be rate limited appropriately.

This is especially important for:

- OTP requests
- OTP verification
- authentication attempts
- OAuth initiation/callback abuse where applicable
- password operations if introduced
- sensitive endpoints

Limits should consider both abuse prevention and legitimate user experience.

---

## CSRF

If authentication uses browser-managed cookies, CSRF protections must be considered and implemented where required by the authentication architecture.

Do not assume that CORS alone provides CSRF protection.

---

## CORS

CORS must use an explicit allowlist appropriate to the deployment environment.

Do not use unrestricted origins for production authenticated APIs without a justified reason.

---

## Security Headers

Production responses should use appropriate security headers.

Headers should be configured according to the application's actual deployment and browser security requirements.

---

## File Upload Security

File uploads must be treated as untrusted input.

Where file uploads are supported:

- validate size
- validate type
- avoid trusting client-provided MIME types alone
- use safe storage locations
- prevent executable content from being served unsafely
- restrict access appropriately
- scan/process files when the threat model requires it

---

## Logging

Security-relevant events should be logged appropriately.

Never log:

- OTP values
- authentication secrets
- access tokens
- refresh tokens
- passwords
- private keys
- sensitive personal data unless explicitly required and protected

Logs should provide enough context to investigate security events without becoming a source of data leakage.

---

## Error Disclosure

Production API errors must not expose:

- stack traces
- database internals
- SQL details
- secret values
- internal filesystem paths
- implementation details useful to attackers

Detailed diagnostics belong in protected server-side logs.

---

## Dependencies

Security-sensitive dependencies should be kept reasonably current.

Before introducing a dependency, consider:

- maintenance status
- security history
- necessity
- package permissions
- transitive dependency impact

Do not add security-sensitive libraries without understanding their role.

---

## Security Changes

Changes involving authentication, authorization, secrets, sensitive data, or security boundaries require additional review.

When security behavior is uncertain, choose the safer reasonable behavior and escalate architectural uncertainty rather than weakening the requirement.
