# Current task: Athlete race workspace

## Plan

- [x] Inspect the existing post-access athlete flow.
- [x] Add the accessible race workspace tab shell.
- [x] Keep Heat Lookup and check-in behavior intact inside the first tab.
- [x] Add honest placeholders for routes, prep guides, and offers.
- [x] Verify mobile, desktop, keyboard, and regression behavior.
- [x] Prepare the deployment and production verification checklist.

## Results

Added an authenticated, race-scoped workspace with Heat Lookup, Route & Workouts, Prep Guides, and Offers. The existing heat result and check-in flow remain functional inside Heat Lookup. Password and passwordless entry, tab click and arrow-key navigation, preserved search state, console output, and 360/390/430/1280px layouts pass with no document-level horizontal overflow.

## Follow-up queued

- Run a focused dependency-maintenance phase for the existing `@vercel/oidc`, Google API, and transitive dependency advisories. Upgrade with compatibility tests rather than forcing breaking versions into a UX release.
