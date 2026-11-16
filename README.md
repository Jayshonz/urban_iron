# Urban Iron Athlete Portal — OIDC v4

Vercel OIDC + Google Cloud Workload Identity Federation, with narrowly scoped Google Sheets access.

## v4 athlete experience

- Race password is requested once after an athlete selects a race.
- Successful password entry creates a short-lived, race-specific session token; the password field disappears for the session.
- Athlete search supports partial first name, partial last name, partial email, full name, and light typo tolerance for names. Email addresses are never returned to the browser.
- Multiple matches are shown as a selectable list.
- Athlete detail labels are explicit: Heat, Bib Number, Estimated Start Time.
- Athletes can open their heat roster and see everyone assigned to that heat without exposing emails.
- Race-specific route, workout, and race-day notes are visible only after the matching race is unlocked.

## Unified race admin

- `https://admin.urbaniron.co/` is the neutral administrator entry with Race Operations and Photo Management destinations.
- Staff open `/admin` and authenticate with the shared Urban Iron admin password. A signed cross-portal handoff may reuse that authenticated identity without transmitting the password.
- The All Races view reads the canonical Urban Iron Race Registry and exposes race-scoped operations, portal, heat-release, assignment-lock, and check-in controls.
- The race workspace links directly to the race workbook, public Athlete portal, Photo admin, and race gallery.
- Photographer uploads remain outside admin at `https://photos.urbaniron.co/photographer`.
- The Portal Content section saves route, workout, race-day notes, prep guides, and offers to the existing `Athlete Portal Content` worksheet.
- Public heat lookup and roster endpoints enforce the canonical `Heats Released` control; unreleased races display “Heats available soon.”
- The worksheet is created with race-scoped rows the first time content is saved.
- Admin sessions are HTTP-only, secure, same-site cookies and expire after eight hours.

## Required Vercel environment variables

- GCP_PROJECT_ID
- GCP_PROJECT_NUMBER
- GCP_SERVICE_ACCOUNT_EMAIL
- GCP_WORKLOAD_IDENTITY_POOL_ID
- GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID
- RACE_REGISTRY_SHEET_ID
- ADMIN_RACE_REGISTRY_SHEET_ID
- RACE_PASSWORDS_SHEET_ID
- URBAN_IRON_ADMIN_PASSWORD (the shared 12+ character admin secret used by both admin deployments, stored as a Vercel Sensitive environment variable)
- ATHLETE_ADMIN_PASSWORD (legacy Race Admin fallback; remove after `URBAN_IRON_ADMIN_PASSWORD` is configured)
- ADMIN_SSO_SECRET (the same randomly generated 32+ character Sensitive value on both admin deployments)
- ADMIN_SSO_ISSUER (`https://admin.urbaniron.co`)
- ATHLETE_ADMIN_ISSUER (`https://athletes.urbaniron.co`)
- PHOTO_ADMIN_URL (`https://admin.urbaniron.co`)

The Photo Admin deployment must use the same human password, stored there as its scrypt `ADMIN_PASSWORD_HASH`, and the same `ADMIN_SSO_SECRET`. Signed assertions expire after 60 seconds and never contain the password.

The Google service account must have editor access to the registry spreadsheet so the editor can create and update the `Athlete Portal Content` worksheet.
