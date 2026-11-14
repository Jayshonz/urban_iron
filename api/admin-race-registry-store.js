export const ADMIN_RACE_REGISTRY_RANGE = "'Races'!A1:U";

const FIELD_HEADERS = Object.freeze({
  name: 'Race Name',
  date: 'Race Date',
  status: 'Status',
  raceSheetId: 'Race Sheet ID',
  rawTab: 'Raw Tab',
  heatAssignmentTab: 'Heat Assignment Tab',
  slackChannel: 'Slack Channel',
  lastHeatAgentRun: 'Last Heat Agent Run',
  lastNewParticipants: 'Last New Participants',
  notes: 'Notes',
  id: 'Race ID',
  city: 'City',
  athletePortalStatus: 'Athlete Portal Status',
  heatsReleased: 'Heats Released',
  assignmentsLocked: 'Assignments Locked',
  checkInEnabled: 'Check In Enabled',
  photoRaceSlug: 'Photo Race Slug',
  photoStatus: 'Photo Status',
  photographerUploads: 'Photographer Uploads',
  lastUpdated: 'Last Updated',
  lastUpdatedBy: 'Last Updated By',
});

const CONTROL_OPTIONS = Object.freeze({
  status: new Set(['Planned', 'Active', 'Inactive', 'Complete', 'Archived']),
  athletePortalStatus: new Set(['Draft', 'Live', 'Offline']),
  heatsReleased: new Set(['Yes', 'No']),
  assignmentsLocked: new Set(['Yes', 'No']),
  checkInEnabled: new Set(['Yes', 'No']),
});

function value(row, indexes, field) {
  const index = indexes[field];
  return index >= 0 ? String(row[index] || '').trim() : '';
}

function isYes(input) {
  return String(input || '').trim().toLowerCase() === 'yes';
}

export function adminRegistrySpreadsheetId() {
  return String(process.env.ADMIN_RACE_REGISTRY_SHEET_ID || '').trim();
}

export function racesFromAdminRegistryRows(rows = []) {
  const headers = rows[0] || [];
  const indexes = Object.fromEntries(
    Object.entries(FIELD_HEADERS).map(([field, header]) => [field, headers.indexOf(header)]),
  );
  if (indexes.id < 0 || indexes.name < 0) return [];

  return rows.slice(1).map((row, offset) => ({
    rowNumber: offset + 2,
    id: value(row, indexes, 'id'),
    name: value(row, indexes, 'name'),
    city: value(row, indexes, 'city'),
    date: value(row, indexes, 'date'),
    status: value(row, indexes, 'status'),
    raceSheetId: value(row, indexes, 'raceSheetId'),
    rawTab: value(row, indexes, 'rawTab'),
    heatAssignmentTab: value(row, indexes, 'heatAssignmentTab'),
    slackChannel: value(row, indexes, 'slackChannel'),
    lastHeatAgentRun: value(row, indexes, 'lastHeatAgentRun'),
    lastNewParticipants: value(row, indexes, 'lastNewParticipants'),
    notes: value(row, indexes, 'notes'),
    athletePortalStatus: value(row, indexes, 'athletePortalStatus'),
    heatsReleased: isYes(value(row, indexes, 'heatsReleased')),
    assignmentsLocked: isYes(value(row, indexes, 'assignmentsLocked')),
    checkInEnabled: isYes(value(row, indexes, 'checkInEnabled')),
    photoRaceSlug: value(row, indexes, 'photoRaceSlug'),
    photoStatus: value(row, indexes, 'photoStatus'),
    photographerUploads: value(row, indexes, 'photographerUploads'),
    lastUpdated: value(row, indexes, 'lastUpdated'),
    lastUpdatedBy: value(row, indexes, 'lastUpdatedBy'),
  })).filter((race) => race.id && race.name);
}

export async function getAdminRaces(sheets, spreadsheetId = adminRegistrySpreadsheetId()) {
  if (!spreadsheetId) return [];
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: ADMIN_RACE_REGISTRY_RANGE,
  });
  return racesFromAdminRegistryRows(response.data.values || []);
}

export async function getAdminRace(sheets, raceId, spreadsheetId = adminRegistrySpreadsheetId()) {
  if (!spreadsheetId || !raceId) return null;
  const races = await getAdminRaces(sheets, spreadsheetId);
  return races.find((race) => race.id === raceId) || null;
}

export function validateRaceControlPatch(input = {}) {
  const patch = {};
  const errors = [];
  Object.entries(CONTROL_OPTIONS).forEach(([field, allowed]) => {
    if (!(field in input)) return;
    const candidate = typeof input[field] === 'boolean'
      ? (input[field] ? 'Yes' : 'No')
      : String(input[field] || '').trim();
    if (!allowed.has(candidate)) errors.push(`${FIELD_HEADERS[field]} is invalid.`);
    else patch[field] = candidate;
  });
  if (!Object.keys(patch).length && !errors.length) errors.push('Choose at least one race control to update.');
  return { patch, errors };
}

export async function updateAdminRaceControls({
  sheets,
  spreadsheetId = adminRegistrySpreadsheetId(),
  raceId,
  patch,
  updatedBy = 'Urban Iron admin',
  now = new Date(),
}) {
  if (!spreadsheetId) throw new Error('Admin race registry is not configured');
  const race = await getAdminRace(sheets, raceId, spreadsheetId);
  if (!race) return null;

  const current = {
    status: race.status,
    athletePortalStatus: race.athletePortalStatus,
    heatsReleased: race.heatsReleased ? 'Yes' : 'No',
    assignmentsLocked: race.assignmentsLocked ? 'Yes' : 'No',
    checkInEnabled: race.checkInEnabled ? 'Yes' : 'No',
    ...patch,
  };
  const row = race.rowNumber;
  const timestamp = now.toISOString();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `'Races'!C${row}`, values: [[current.status]] },
        {
          range: `'Races'!M${row}:P${row}`,
          values: [[
            current.athletePortalStatus,
            current.heatsReleased,
            current.assignmentsLocked,
            current.checkInEnabled,
          ]],
        },
        { range: `'Races'!T${row}:U${row}`, values: [[timestamp, updatedBy]] },
      ],
    },
  });
  return getAdminRace(sheets, raceId, spreadsheetId);
}

export function publicRaceControls(race) {
  if (!race) return null;
  return {
    athletePortalStatus: race.athletePortalStatus,
    heatsReleased: race.heatsReleased,
    checkInEnabled: race.checkInEnabled,
  };
}
