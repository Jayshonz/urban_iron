# Project lessons

## Lesson: Verify analytics pricing before selecting telemetry

**Trigger:** Vercel Analytics was initially recommended for simplicity, but the user prioritizes avoiding variable analytics charges and requested GA4 once pricing was clarified.
**Pattern:** Operational convenience can obscure metered-event costs, especially when pageviews and product actions are each billable events.
**Rule:** Before selecting an analytics provider, verify the current plan, included usage, overage pricing, privacy implications, and required event depth. Present the cost comparison before implementation and avoid running duplicate trackers by default.
**Date:** 2026-11-18

## Lesson: Reverse proxies change the browser origin contract

**Trigger:** Race Admin was moved under `admin.urbaniron.co`, but proxied write requests still reached the Athlete backend, whose CSRF check accepted only the backend host.
**Pattern:** Moving a UI behind a canonical host can preserve sessions and routes while silently breaking state-changing requests at origin validation.
**Rule:** Whenever an authenticated interface is proxied across hosts, test a real state-changing request with the browser-visible `Origin`. Allow only explicit trusted admin origins, keep hostile-origin rejection, and verify both read and write paths before declaring the move complete.
**Date:** 2026-11-16

## Lesson: Shared credentials are not shared sessions

**Trigger:** The two admin portals could use the same password, but separate domain cookies still made the user authenticate twice and obscured which admin surface they had entered.
**Pattern:** Treating credential equality as single sign-on solves configuration while leaving the user experience fragmented.
**Rule:** A multi-domain “one login” requirement must use a bounded signed handoff or deliberately shared cookie contract; never send the raw password between applications or claim the experience is unified merely because the password strings match.
**Date:** 2026-11-15

## Lesson: Cross-property navigation is one contract

**Trigger:** The Athlete and Photo portals had reciprocal links, but their visible navigation differed in item count, typography, weight, spacing, and platform affordances.
**Pattern:** Adding links independently to sibling products makes the destinations technically connected while still feeling like unrelated websites.
**Rule:** Define public cross-property navigation as one ordered contract. When one portal gains a shared destination or changes its header presentation, audit and align every sibling portal before calling the navigation complete.
**Date:** 2026-11-13

## Lesson: Separate administrator and operator audiences

**Trigger:** Photographer uploads were presented alongside race and photo administration even though photographers are external operators choosing a race and uploading media.
**Pattern:** Grouping every internal-looking workflow under “Admin” blurred audience boundaries and made the photo platform appear to own all Urban Iron administration.
**Rule:** Keep the central admin limited to administrator destinations. Put photographer uploads on the public photo domain, link them from the photo-platform navigation, and never describe the uploader as an admin tool.
**Date:** 2026-11-13

## Lesson: Public content promises require matching admin controls

**Trigger:** Prep Guides and Offers were visible as public portal sections, but the Athlete admin only exposed route, workout, and notes fields, leaving partner coupons hardcoded and uneditable.
**Pattern:** Shipping a public placeholder before defining its race-scoped authoring path makes the admin feel incomplete and encourages production sample data to outlive its intended phase.
**Rule:** Every public race-content section must ship with an authorized race-scoped editor, validated storage contract, and honest empty state; placeholder partner offers must never be presented as operational coupons.
**Date:** 2026-11-04

## Lesson: Phase ordering

**Trigger:** The user clarified that the athlete portal needs a dedicated race-selection home page before the unlocked race tabs are built.
**Pattern:** “Next step” referred to the next product layer, not automatically to the next implementation idea discussed.
**Rule:** For piecemeal product work, establish the page hierarchy and entry point before implementing deeper workspace navigation.
**Date:** 2026-10-29

## Lesson: Future-feature language

**Trigger:** The user preferred “Coming soon” over “Coming later” for the reserved member-login area.
**Pattern:** Internal sequencing language can sound indefinite in customer-facing UI.
**Rule:** Use concise launch-oriented language such as “Coming soon” for visible future features unless the user specifies otherwise.
**Date:** 2026-10-29
