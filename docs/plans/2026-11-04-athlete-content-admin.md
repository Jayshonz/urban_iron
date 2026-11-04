# Athlete portal content administration

## Goal

Repair the hosted race-content save failure and make every public race-content area editable from one race-scoped Athlete admin workspace.

## Plan

1. Reproduce the hosted failure from Vercel logs and repair the Google Sheets storage prerequisite without weakening authorization.
2. Extend the race-content contract with bounded Prep Guide and Offer records stored on the exact race row.
3. Add compact admin tabs and repeatable editors for race-day information, prep guides, and partner offers/coupon codes.
4. Render the saved guides and offers in the public portal after the matching race is unlocked; use honest empty states when no records exist.
5. Add tests for validation, exact race isolation, authorization, and storage round trips; run syntax/tests and verify hosted save/read behavior after deployment.

## Data shape

- One row per `race_id` in the existing `Athlete Portal Content` worksheet.
- Prep guides are a bounded JSON array of title, description, and HTTPS link records.
- Offers are a bounded JSON array of partner, title, description, coupon code, HTTPS destination, optional HTTPS logo, and active state.
- No client-supplied race ID is trusted without matching the published race registry and an authorized admin session.

## Non-goals

- Generic CMS infrastructure.
- Customer accounts.
- File/PDF upload storage in this phase; guides link to approved HTTPS resources.
