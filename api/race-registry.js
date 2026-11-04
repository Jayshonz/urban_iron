import { google } from 'googleapis';
import { raceCheckInEnabled } from './check-in-data.js';
import { raceRequiresPassword } from './data.js';
import { getGoogleAuthClient } from './google-auth.js';

export function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getGoogleAuthClient() });
}

export async function getPublishedRaces(sheets = getSheetsClient()) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.RACE_REGISTRY_SHEET_ID,
    range: "'Race Registry'!A2:K",
  });
  const rows = response.data.values || [];
  return rows
    .filter((row) => row[4] === 'Live' && row[5] === 'Yes')
    .map((row) => ({
      id: row[0],
      city: row[1],
      date: row[2],
      lastUpdated: row[6],
      checkInEnabled: raceCheckInEnabled(rows, row[0]),
      requiresPassword: raceRequiresPassword(row[0]),
    }));
}
