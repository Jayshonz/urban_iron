import assert from 'node:assert/strict';
import test from 'node:test';
import {
  publicRaceControls,
  racesFromAdminRegistryRows,
  validateRaceControlPatch,
} from '../api/admin-race-registry-store.js';

const headers = [
  'Race Name', 'Race Date', 'Status', 'Race Sheet ID', 'Raw Tab', 'Heat Assignment Tab',
  'Slack Channel', 'Last Heat Agent Run', 'Last New Participants', 'Notes', 'Race ID', 'City',
  'Athlete Portal Status', 'Heats Released', 'Assignments Locked', 'Check In Enabled',
  'Photo Race Slug', 'Photo Status', 'Photographer Uploads', 'Last Updated', 'Last Updated By',
];

test('maps the canonical race registry without exposing blank rows', () => {
  const rows = [
    headers,
    [
      'Urban Iron Miami 12.20.26', '2026-12-20', 'Active', 'sheet-1', 'Raw Data', 'Heat Assignments',
      '#race-status-updates', '2026-11-13', 1, 'Ready', 'miami-2026-12-20', 'Miami', 'Live',
      'No', 'No', 'Yes', 'urban-iron-miami', 'Published', 'Open', '2026-11-13', 'Portal admin',
    ],
    [],
  ];
  const races = racesFromAdminRegistryRows(rows);
  assert.equal(races.length, 1);
  assert.equal(races[0].id, 'miami-2026-12-20');
  assert.equal(races[0].rowNumber, 2);
  assert.equal(races[0].heatsReleased, false);
  assert.equal(races[0].checkInEnabled, true);
  assert.deepEqual(publicRaceControls(races[0]), {
    athletePortalStatus: 'Live', heatsReleased: false, checkInEnabled: true,
  });
});

test('rejects unknown control values and accepts boolean toggles', () => {
  const invalid = validateRaceControlPatch({ status: 'Maybe', athletePortalStatus: 'Public' });
  assert.equal(invalid.errors.length, 2);
  const valid = validateRaceControlPatch({
    status: 'Active', athletePortalStatus: 'Live', heatsReleased: true,
    assignmentsLocked: false, checkInEnabled: true,
  });
  assert.deepEqual(valid.errors, []);
  assert.deepEqual(valid.patch, {
    status: 'Active', athletePortalStatus: 'Live', heatsReleased: 'Yes',
    assignmentsLocked: 'No', checkInEnabled: 'Yes',
  });
});

test('requires at least one actual race control', () => {
  const result = validateRaceControlPatch({ photoStatus: 'Published' });
  assert.match(result.errors.join(' '), /at least one race control/i);
});
