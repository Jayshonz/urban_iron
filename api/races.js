import { getPublishedRaces } from './race-registry.js';

export default async function handler(req, res) {
  try {
    const races = await getPublishedRaces();

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ races });
  } catch (error) {
    console.error('races error', error);
    return res.status(500).json({ error: 'Unable to load races' });
  }
}
