# Public portal navigation alignment

## Goal

Make the Athlete and Photo portals feel like two views of one Urban Iron platform.

## Shared contract

- `Home` opens `https://urbaniron.co/`.
- The second item is the reciprocal portal: `Photos` from Athletes and `Athletes` from Photos.
- `Photographer` opens the canonical public upload entry at `https://photos.urbaniron.co/photographer`.
- `Admin` opens the existing authenticated photo-admin route at `https://admin.urbaniron.co/admin`.
- The Athlete-only `Member login / Coming soon` treatment remains separate from navigation.
- Public navigation typography and spacing match the Photo portal.

## Verification

- Add a regression test for the Athlete header destinations and ordering.
- Run the full Node test suite and syntax checks.
- Verify desktop and narrow responsive layouts in a browser.
- Deploy and inspect the live Athlete header and all cross-platform destinations.
