# Central Urban Iron admin home

## Goal

Make `admin.urbaniron.co` a neutral administrator entry point for race operations and photo management, while keeping photographer uploads outside the admin information architecture at `photos.urbaniron.co/photographer`.

## Plan

1. Add a lightweight central admin landing page to the Athlete portal deployment.
2. Link the landing page to Race Operations and Photo Management only.
3. Remove photographer-upload navigation and actions from the race admin.
4. Route the bare admin domain to the central landing page without disturbing the existing photo admin or shared authentication paths.
5. Redirect the legacy admin-domain photographer path to the photographer-facing photo-domain path.
6. Run syntax, tests, local browser QA, deployment checks, and production route verification.

## Safety

- Preserve `admin.urbaniron.co/admin` for the existing photo admin and shared Google authentication.
- Preserve `athletes.urbaniron.co/admin` for race administration.
- Change only exact host/path routing rules and retain a restorable Vercel route version.
