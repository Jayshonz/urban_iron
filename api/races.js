import { google } from 'googleapis';
import { getGoogleAuthClient } from './google-auth.js';
import { raceCheckInEnabled } from './check-in-data.js';
import { raceRequiresPassword } from './data.js';

export default async function handler(req, res) {
  try {
    const auth = getGoogleAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.RACE_REGISTRY_SHEET_ID,
      range: "'Race Registry'!A2:K",
    });

    const rows = response.data.values || [];
    const races = rows
      .filter((row) => row[4] === 'Live' && row[5] === 'Yes')
      .map((row) => ({
        id: row[0],
        city: row[1],
        date: row[2],
        lastUpdated: row[6],
        checkInEnabled: raceCheckInEnabled(rows, row[0]),
        requiresPassword: raceRequiresPassword(row[0]),
      }));

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ races });
  } catch (error) {
    console.error('races error', error);
    return res.status(500).json({ error: 'Unable to load races' });
  }
}
