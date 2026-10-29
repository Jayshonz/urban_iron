# Athlete race workspace

## Goal

After race access is granted, give athletes one compact workspace for the four race resources already promised on the homepage.

## Scope

- Add accessible tabs for Heat Lookup, Route & Workouts, Prep Guides, and Offers.
- Keep the existing heat lookup and check-in experience fully functional inside Heat Lookup.
- Use honest placeholders for the three content areas that do not yet have race data.
- Preserve tab state while an athlete moves between resources.
- Keep the layout compact on desktop and horizontally scrollable on narrow mobile screens.
- Keep all content race-scoped behind the existing race access session.

## Not in this phase

- CMS or admin editing tools.
- Member accounts or member login.
- Real route, workout, guide, PDF, or partner-offer content.
- Dependency upgrades; those require a separate compatibility and security pass.

## Validation

- Verify password and passwordless entry both open Heat Lookup.
- Verify tab selection, ARIA state, keyboard focus, and preserved heat results.
- Verify returning to race selection clears the workspace safely.
- Check 360px, 390px, 430px, and desktop layouts.
- Run JavaScript/API syntax, JSON, diff, console, and live deployment checks.
