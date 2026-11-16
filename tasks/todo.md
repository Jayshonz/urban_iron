# Current task: One-password Urban Iron admin

## Plan

- [x] Identify the two deployments, current login surfaces, and existing signed handoff.
- [x] Make the shared password the primary Race Admin login.
- [x] Complete the password-session handoff between Photo Admin and Race Admin.
- [x] Add cross-application regression coverage for login, handoff, and failure states.
- [x] Run Race Admin checks; verify both admin entry points after Photo Admin access is available.

## Progress

- [x] Confirmed Race Admin (`athletes.urbaniron.co`) and Photo Admin (`admin.urbaniron.co`) are separate Vercel projects.
- [x] Confirmed the Race Admin already has a password session and a signed handoff verifier.
- [x] Race Admin now presents one password form and supports the canonical `URBAN_IRON_ADMIN_PASSWORD` environment variable with a legacy fallback.
- [x] Race Admin test suite passes: 27 tests, 0 failures; syntax checks and diff checks pass.
- [x] Photo Admin repository access confirmed with read/write permissions.
- [x] Race Admin now creates a short-lived password-session assertion for Photo Admin without transmitting the password.
- [x] Photo Admin receiver and password-first UI implemented on `codex/shared-admin-password`.
- [x] Photo Admin focused tests pass (6/6) and its Vercel preview production build is Ready.
- [x] Race Admin tests pass (29/29) and syntax checks pass.

---

# Previous task: Align Athlete and Photo portal navigation

## Plan

- [x] Measure both production headers and define the shared navigation contract.
- [x] Add the missing Photographer destination and align Athlete navigation styling.
- [x] Add regression coverage for labels, ordering, and destinations.
- [x] Run full checks, deploy, and visually verify production at desktop and mobile widths.

## Progress

- [x] Confirmed that both portals already share Home, reciprocal portal, and Admin destinations.
- [x] Identified the concrete visual mismatch: Athlete uses Arial 11/700; Photos uses Space Mono 12/400.
- [x] Athlete navigation is live and matches the Photo portal's measured font, size, weight, padding, and link height.

## Results

- `npm run check` passed.
- `npm test` passed with 25 tests and 0 failures.
- Desktop and 390×844 browser reviews passed; mobile document width remained 390px with no horizontal overflow.
- Production links for Home, Photos, Photographer, and Admin resolve, and the deployed Athlete metrics match the live Photo navigation.
- PR #21 merged and production deployment completed successfully.

---

# Previous task: Central admin home and photographer separation

## Plan

- [x] Confirm the current domain, authentication, race-admin, photo-admin, and photographer routes.
- [x] Add a neutral central admin landing page with Races and Photos only.
- [x] Remove photographer-upload navigation from the race admin.
- [x] Add bounded host/path routing for the admin homepage and legacy photographer URL.
- [x] Run tests, browser QA, deploy, and verify every production destination.

## Progress

- [x] Selected a route-level implementation that preserves the private photo app and shared login.
- [x] Central landing page and race-admin navigation implemented and locally reviewed.
- [x] Production routing and deployment verification complete.

---

# Previous task: Unified race admin and registry

## Plan

- [ ] Extend and verify the canonical Urban Iron Race Registry schema.
- [ ] Add authenticated all-race registry read and bounded control-update APIs.
- [ ] Build the clean All Races directory and race workspace navigation.
- [ ] Integrate existing Athlete content editing without duplicating forms or storage.
- [ ] Add direct Athlete, Photo admin, Photographer upload, workbook, and public-preview access.
- [ ] Add focused tests and run full syntax/test verification.
- [ ] Deploy and verify the hosted admin read path before enabling live control writes.

## Progress

- [x] Audited the Athlete portal, Photo platform, photographer entry flow, both registry spreadsheets, and current SSO handoff.
- [x] Confirmed the main heat-operations registry is the intended canonical race index.
- [ ] Registry schema extension in progress.

---

# Previous task: Complete Athlete content admin

## Plan

- [x] Diagnose the hosted save failure from production logs.
- [ ] Create and verify the race-content worksheet with the complete schema.
- [ ] Add validated, race-scoped Prep Guide and Offer storage.
- [ ] Build compact admin editors for all public content tabs.
- [ ] Render saved guides and offers in the unlocked athlete portal.
- [ ] Run focused tests, syntax checks, responsive review, and hosted verification.

## Progress

- [x] Root cause identified: the runtime service account can read the registry but cannot create a worksheet tab (`403 PERMISSION_DENIED`).
- [ ] Storage repair and implementation in progress.

---

# Previous task: Portal cross-links

## Plan

- [x] Add compact Home and Photos links to the athlete portal header.
- [x] Preserve the athlete-home logo and future member-login slot.
- [ ] Validate mobile/desktop layout and link destinations.
- [ ] Deploy and verify both portals in production.

---

# Previous task: Member login status copy

## Plan

- [x] Update the reserved member-login label from “Coming later” to “Coming soon.”
- [x] Verify the old phrase is removed and the page remains valid.
- [x] Prepare deployment and production verification.

## Results

Updated the member-login status copy to “Coming soon.” JavaScript/API syntax, JSON, and diff checks pass, and the previous phrase no longer appears in public files.

## Follow-up queued

- Run a focused dependency-maintenance phase for the existing `@vercel/oidc`, Google API, and transitive dependency advisories. Upgrade with compatibility tests rather than forcing breaking versions into a UX release.
