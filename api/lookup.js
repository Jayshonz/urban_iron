import crypto from 'node:crypto';
import { google } from 'googleapis';
import { getGoogleAuthClient } from './google-auth.js';

const norm = (value) => String(value || '').trim().toLowerCase();

function safeEqual(a, b) {
  const aHash = crypto.createHash('sha256').update(String(a)).digest();
  const bHash = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(aHash, bHash);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { raceId, password, query } = req.body || {};
    if (!raceId || !password || !query) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const auth = getGoogleAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const [registryResponse, passwordResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.RACE_REGISTRY_SHEET_ID,
        range: "'Race Registry'!A2:J",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.RACE_PASSWORDS_SHEET_ID,
        range: "'Race Passwords'!A2:F",
      }),
    ]);

    const race = (registryResponse.data.values || []).find(
      (row) => row[0] === raceId && row[4] === 'Live' && row[5] === 'Yes',
    );
    if (!race) return res.status(404).json({ error: 'Race unavailable' });

    const passwordRow = (passwordResponse.data.values || []).find(
      (row) => row[0] === raceId && row[4] === 'Yes',
    );
    if (!passwordRow || !safeEqual(password, passwordRow[3])) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const match = String(race[3] || '').match(/\/spreadsheets\/d\/([^/]+)/);
    if (!match) return res.status(500).json({ error: 'Invalid race source' });

    const lookupResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: match[1],
      range: "'App Lookup'!A2:G",
    });

    const q = norm(query);
    const results = (lookupResponse.data.values || [])
      .filter((row) => norm(`${row[0]} ${row[1]}`) === q || norm(row[2]) === q)
      .slice(0, 10)
      .map((row) => ({
        first: row[0],
        last: row[1],
        bib: row[3],
        heatNumber: row[4],
        heatName: row[5],
        start: row[6],
      }));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ results });
  } catch (error) {
    console.error('lookup error', error);
    return res.status(500).json({ error: 'Lookup unavailable' });
  }
}
