import { google } from 'googleapis';
import { adminRegistrySpreadsheetId, getAdminRaces } from './admin-race-registry-store.js';
import { raceRequiresPassword } from './data.js';
import { getGoogleAuthClient } from './google-auth.js';

export function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getGoogleAuthClient() });
}

export async function getPublishedRaces(sheets = getSheetsClient()) {
  const canonicalId = adminRegistrySpreadsheetId();
  const [response, canonicalRaces] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: process.env.RACE_REGISTRY_SHEET_ID,
      range: "'Race Registry'!A2:K",
    }),
    canonicalId ? getAdminRaces(sheets, canonicalId) : Promise.resolve([]),
  ]);
  const rows = response.data.values || [];
  const canonicalById = new Map(canonicalRaces.map((race) => [race.id, race]));
  return rows
    .filter((row) => {
      if (row[4] !== 'Live' || row[5] !== 'Yes') return false;
      if (!canonicalRaces.length) return true;
      return canonicalById.get(row[0])?.athletePortalStatus === 'Live';
    })
    .map((row) => {
      const canonical = canonicalById.get(row[0]);
      return {
        id: row[0],
        city: canonical?.city || row[1],
        date: canonical?.date || row[2],
        lastUpdated: canonical?.lastUpdated || row[6],
        checkInEnabled: canonical ? canonical.checkInEnabled : row[10] === 'Yes',
        heatsReleased: canonical ? canonical.heatsReleased : true,
        requiresPassword: raceRequiresPassword(row[0]),
      };
    });
}
