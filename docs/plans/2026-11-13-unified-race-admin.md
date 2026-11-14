# Unified Urban Iron race admin

## Goal

Turn the Athlete admin into a clean, race-centric control surface that exposes the main Urban Iron Race Registry, preserves the separate athlete and photographer experiences, and gives every approved admin direct access to Athlete and Photo administration.

## Release boundary

This release establishes the shared admin shell and canonical race controls without moving photo assets, orders, or photographer uploads into Google Sheets.

## Plan

1. Extend the main `Races` tab with stable race identity and portal control fields, preserving the existing heat-agent columns and values.
2. Add a race-registry API that reads all canonical races for admins and applies validated, bounded status updates.
3. Rebuild `/admin` around an All Races directory and a selected-race workspace with Overview and Portal Content sections.
4. Keep Athlete, Photo admin, Photographer uploads, public previews, and race workbooks as explicit deep links.
5. Adopt the lighter staff visual language already used by the Photo admin.
6. Add tests for schema mapping, authorization, validation, and update targeting; run syntax and full test verification.
7. Deploy behind the existing admin authentication and verify the hosted read path before enabling registry writes in production.

## Canonical race controls

- Race ID
- City
- Operations status
- Athlete portal status
- Heats released
- Assignments locked
- Check-in enabled
- Photo race slug
- Photo status
- Photographer uploads
- Last updated
- Last updated by

## Safety constraints

- Preserve existing heat-agent columns A:J.
- Never modify raw registration or race-assignment tabs as part of this release.
- Use exact race IDs for writes and reject unknown races.
- Require an authenticated admin session and same-origin request for all writes.
- Keep photo data in the Photo platform; store only cross-platform identifiers and high-level status in the registry.
- Read back the registry range after schema changes and after any production write enablement.
