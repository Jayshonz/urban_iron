import { google } from 'googleapis';
import { adminRegistrySpreadsheetId, getAdminRace } from './admin-race-registry-store.js';
import { getGoogleAuthClient } from './google-auth.js';

export function norm(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

const PASSWORDLESS_RACE_IDS = new Set(['la-2026-10-04']);

export function raceRequiresPassword(raceId) {
  return !PASSWORDLESS_RACE_IDS.has(String(raceId || '').trim());
}

export async function getContext(raceId) {
  const auth = getGoogleAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const canonicalId = adminRegistrySpreadsheetId();
  const [registryResponse, passwordResponse, controls] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: process.env.RACE_REGISTRY_SHEET_ID,
      range: "'Race Registry'!A2:J",
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: process.env.RACE_PASSWORDS_SHEET_ID,
      range: "'Race Passwords'!A2:F",
    }),
    canonicalId ? getAdminRace(sheets, raceId, canonicalId) : Promise.resolve(null),
  ]);

  const race = (registryResponse.data.values || []).find(
    (row) => row[0] === raceId && row[4] === 'Live' && row[5] === 'Yes',
  );
  if (!race) return { error: { status: 404, message: 'Race unavailable' } };
  if (canonicalId && (!controls || controls.athletePortalStatus !== 'Live')) {
    return { error: { status: 404, message: 'Race unavailable' } };
  }

  const passwordRow = (passwordResponse.data.values || []).find(
    (row) => row[0] === raceId && row[4] === 'Yes',
  );
  if (!passwordRow) return { error: { status: 401, message: 'Race access unavailable' } };

  const match = String(race[3] || '').match(/\/spreadsheets\/d\/([^/]+)/);
  if (!match) return { error: { status: 500, message: 'Invalid race source' } };

  return {
    sheets,
    race,
    controls,
    password: String(passwordRow[3] || ''),
    spreadsheetId: match[1],
  };
}

export async function getLookupRows(sheets, spreadsheetId) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'App Lookup'!A2:H",
  });
  return response.data.values || [];
}

export function mapParticipant(row) {
  return {
    first: row[0] || '',
    last: row[1] || '',
    bib: row[3] || '',
    heatNumber: row[4] || '',
    heatName: row[5] || '',
    start: row[6] || '',
    shirtSize: row[7] || '',
  };
}
