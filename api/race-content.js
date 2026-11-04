import { getContext } from './data.js';
import { getRaceContent } from './race-content-store.js';
import { verifyRaceSession } from './session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { raceId, accessToken } = req.body || {};
    if (!raceId || !accessToken) return res.status(400).json({ error: 'Missing race access' });
    const context = await getContext(raceId);
    if (context.error) return res.status(context.error.status).json({ error: context.error.message });
    if (!verifyRaceSession(accessToken, raceId, context.password)) {
      return res.status(401).json({ error: 'Session expired. Enter the race password again.' });
    }
    const content = await getRaceContent(
      context.sheets,
      process.env.RACE_REGISTRY_SHEET_ID,
      raceId,
    );
    return res.status(200).json({ content });
  } catch (error) {
    console.error('race content error', error);
    return res.status(500).json({ error: 'Unable to load race-day information' });
  }
}
