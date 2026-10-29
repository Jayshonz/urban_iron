# Athlete portal domain migration

## Scope

- Rename public-facing participant terminology to athlete terminology.
- Make `athletes.urbaniron.co` the canonical custom domain.
- Redirect `participants.urbaniron.co` to the matching path on the athlete domain.
- Preserve the existing race lookup, heat, and check-in behavior.

## Verification

- Run JavaScript syntax checks.
- Confirm no old public-facing participant copy remains.
- Verify the Vercel deployment and both custom-domain behaviors.
