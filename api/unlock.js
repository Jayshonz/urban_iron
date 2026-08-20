import { getContext } from './data.js';
import { createRaceSession, safeEqual } from './session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { raceId, password } = req.body || {};
    if (!raceId || !password) return res.status(400).json({ error: 'Enter the race password' });

    const context = await getContext(raceId);
    if (context.error) return res.status(context.error.status).json({ error: context.error.message });
    if (!safeEqual(password, context.password)) return res.status(401).json({ error: 'Invalid password' });

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ accessToken: createRaceSession(raceId, context.password) });
  } catch (error) {
    console.error('unlock error', error);
    return res.status(500).json({ error: 'Unable to unlock race' });
  }
}
