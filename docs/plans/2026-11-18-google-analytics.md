# Urban Iron Google Analytics implementation

## Objective

Add one privacy-conscious GA4 measurement layer across the Athlete, Photos, Photographer, and Admin surfaces without enabling Vercel Web Analytics.

## Decisions

- Use one Urban Iron GA4 property and web stream so journeys can be analyzed across Urban Iron subdomains.
- Separate surfaces and races with non-sensitive event parameters such as `surface`, `race_id`, and `resource_type`.
- Never send athlete names, email addresses, bib numbers, passwords, photo filenames, face-search inputs, signed URLs, or administrator identities.
- Track successful server outcomes where practical; do not record a success event merely because a button was clicked.

## Plan

1. Confirm or create the dedicated Urban Iron GA4 property and obtain its measurement ID.
2. Add a shared GA loader and privacy-safe event helper to the Athlete/Race project.
3. Add GA to the Photo/Admin project and instrument the primary gallery, download, upload, and admin actions.
4. Add regression coverage for the loader, event vocabulary, and sensitive-data exclusions.
5. Run tests and builds for both projects.
6. Deploy, verify real-time pageviews and events on every production hostname, and document where reports live.

