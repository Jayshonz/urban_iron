# Athlete portal guides simplification

## Goal

Repair Race Admin saves from the canonical admin domain and reduce the athlete workspace to three clear destinations: Heats, Race Guides, and Offers.

## Implementation

- Keep origin validation on authenticated write endpoints, but allow the canonical `admin.urbaniron.co` proxy origin in addition to the request host.
- Replace the four athlete tabs with Heats, Race Guides, and Offers.
- Render Race Guides only from the structured guide collection.
- Remove route, workout, and race-note free-form controls from Race Admin while retaining their stored columns for backward compatibility.
- Rename the structured Prep Guides editor to Race Guides and retain add, edit, remove, HTTPS validation, and offer visibility controls.

## Verification

- Add origin-policy coverage for canonical admin, same-origin, malformed, and unrelated origins.
- Add markup and script regression coverage for the three-tab contract and the absence of free-form content controls.
- Run syntax checks and the full test suite.
- Verify the deployed admin save path and athlete navigation on production.
