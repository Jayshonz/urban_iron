import { getContext, getLookupRows, mapParticipant, norm } from './data.js';
import { verifyRaceSession } from './session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { raceId, accessToken, heatName } = req.body || {};
    if (!raceId || !accessToken || !heatName) return res.status(400).json({ error: 'Missing fields' });

    const context = await getContext(raceId);
    if (context.error) return res.status(context.error.status).json({ error: context.error.message });
    if (!verifyRaceSession(accessToken, raceId, context.password)) {
      return res.status(401).json({ error: 'Session expired. Enter the race password again.' });
    }

    const rows = await getLookupRows(context.sheets, context.spreadsheetId);
    const target = norm(heatName);
    const participants = rows
      .filter((row) => norm(row[5]) === target)
      .map(mapParticipant)
      .sort((a, b) => Number(a.bib || 99999) - Number(b.bib || 99999));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ participants });
  } catch (error) {
    console.error('heat error', error);
    return res.status(500).json({ error: 'Unable to load heat' });
  }
}
