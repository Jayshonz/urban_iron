# Readable Urban Iron platform analytics

## Goal

Make GA4 answer race-operations questions directly: how many people entered each race portal, which portal sections they viewed, and which guides or offers they clicked, while keeping personal data out of analytics.

## Implementation

1. Prefix Athlete Portal, Race Admin, and Photographer events consistently.
2. Add `race_name`, `resource_type`, and `resource_title` parameters alongside stable IDs.
3. Register the new parameters as event-scoped GA4 custom dimensions.
4. Update regression tests and deploy both Vercel projects.
5. Verify production collection and recommend a weekly summary backed by realtime/on-demand reporting.
