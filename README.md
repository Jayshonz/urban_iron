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

## Race-day content editor

- Staff open `/admin` and authenticate with the athlete-portal admin password.
- The editor lists published races and saves route, workout, and race-day notes to an `Athlete Portal Content` worksheet in the registry spreadsheet.
- The worksheet is created with race-scoped rows the first time content is saved.
- Admin sessions are HTTP-only, secure, same-site cookies and expire after eight hours.

## Required Vercel environment variables

- GCP_PROJECT_ID
- GCP_PROJECT_NUMBER
- GCP_SERVICE_ACCOUNT_EMAIL
- GCP_WORKLOAD_IDENTITY_POOL_ID
- GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID
- RACE_REGISTRY_SHEET_ID
- RACE_PASSWORDS_SHEET_ID
- ATHLETE_ADMIN_PASSWORD (a unique 12+ character secret, stored as a Vercel Sensitive environment variable)

The Google service account must have editor access to the registry spreadsheet so the editor can create and update the `Athlete Portal Content` worksheet.
