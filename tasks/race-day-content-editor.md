# Race-day content editor

## Goal

Give Urban Iron staff a small, secure editor for each published race's route, workouts, and race-day notes, and show that content to athletes only after they unlock the matching race.

## Plan

- [x] Add dedicated admin authentication and an HTTP-only admin session.
- [x] Store race-day content in a race-scoped `Athlete Portal Content` worksheet.
- [x] Add authorized admin read/write APIs and a race-session-protected public read API.
- [x] Build the `/admin` editor using the existing portal visual language.
- [x] Render saved content in the Route & Workouts tab with useful empty/loading/error states.
- [x] Add focused authorization, validation, and race-isolation tests.
- [x] Run tests and validate responsive layouts before deployment.

## Scope notes

- This phase covers Route & Workouts only.
- Prep guides and partner-offer editing remain placeholders for later phases.
- No separate CMS or paid data service is introduced.
- Dependency audit follow-up: the current Google API/OIDC dependency tree reports advisories whose complete remediation requires a focused breaking-version upgrade; keep that work separate as previously agreed.
