# Urban Iron Participant Portal — OIDC build

This version uses Vercel OIDC + Google Cloud Workload Identity Federation. It does not use or store a Google service-account JSON key.

## Required Vercel environment variables
- GCP_PROJECT_ID
- GCP_PROJECT_NUMBER
- GCP_SERVICE_ACCOUNT_EMAIL
- GCP_WORKLOAD_IDENTITY_POOL_ID
- GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID
- RACE_REGISTRY_SHEET_ID
- RACE_PASSWORDS_SHEET_ID

## Google-side requirements
- Google Sheets API enabled
- Security Token Service API enabled
- IAM Service Account Credentials API enabled
- Vercel Workload Identity provider configured
- Production Vercel subject granted Workload Identity User on the service account
- Service account shared as Viewer on the Race Registry, Race Passwords, and each live race Sheet

## Publishing contract
A race appears only when Registry `Status=Live` and `Portal Enabled=Yes`. Its race Sheet must contain `App Lookup` with columns: First Name, Last Name, Email, Bib Number, Heat Number, Heat Name, Start Time.

Email is used only by the server as a lookup key and is never returned by the API.


## v0.2.1

Explicitly requests `https://www.googleapis.com/auth/spreadsheets.readonly` for the impersonated Google service-account token so the portal can read Google Sheets through Workload Identity Federation.
