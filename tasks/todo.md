# Current task: Complete Athlete content admin

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
