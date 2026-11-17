# Shared Urban Iron admin password

## Goal

Use one password entry to authenticate an administrator across the Urban Iron Race Admin and Photo Admin, without exposing the password in URLs, browser storage, or cross-domain links.

## Plan

1. Audit both deployments' existing password sessions and handoff contract.
2. Make the password form the primary Race Admin login experience.
3. Reuse one signed, short-lived admin identity when crossing between `admin.urbaniron.co` and `athletes.urbaniron.co`.
4. Keep logout and expiry behavior consistent across both applications.
5. Add regression tests for password login, signed handoff, rejection, and navigation.
6. Verify both admin entry points locally, then deploy and verify production.

## Security boundaries

- Never transmit the raw password between domains.
- Never place credentials or assertions in query strings.
- Validate audience, expiry, and signature on every handoff.
- Keep the existing Google implementation dormant until it is intentionally re-enabled.
