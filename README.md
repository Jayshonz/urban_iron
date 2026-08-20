# Urban Iron Participant Portal — OIDC v4

Vercel OIDC + Google Cloud Workload Identity Federation, with Google Sheets read-only access.

## v4 participant experience

- Race password is requested once after a participant selects a race.
- Successful password entry creates a short-lived, race-specific session token; the password field disappears for the session.
- Participant search supports partial first name, partial last name, partial email, full name, and light typo tolerance for names. Email addresses are never returned to the browser.
- Multiple matches are shown as a selectable list.
- Participant detail labels are explicit: Heat, Bib Number, Estimated Start Time.
- Participants can open their heat roster and see everyone assigned to that heat without exposing emails.

## Required Vercel environment variables

- GCP_PROJECT_ID
- GCP_PROJECT_NUMBER
- GCP_SERVICE_ACCOUNT_EMAIL
- GCP_WORKLOAD_IDENTITY_POOL_ID
- GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID
- RACE_REGISTRY_SHEET_ID
- RACE_PASSWORDS_SHEET_ID
