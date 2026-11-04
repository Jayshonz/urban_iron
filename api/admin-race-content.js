import { requestHasAdminSession, requestIsSameOrigin } from './admin-auth.js';
import { getPublishedRaces, getSheetsClient } from './race-registry.js';
import {
  getRaceContent,
  saveRaceContent,
  validateRaceContent,
} from './race-content-store.js';

function requestedRaceId(req) {
  if (typeof req.query?.raceId === 'string') return req.query.raceId;
  try {
    return new URL(req.url, 'https://athletes.urbaniron.co').searchParams.get('raceId') || '';
  } catch {
    return '';
  }
}

export default async function handler(req, res) {
  if (!['GET', 'PUT'].includes(req.method)) return res.status(405).end();
  res.setHeader('Cache-Control', 'no-store');
  if (!requestHasAdminSession(req)) return res.status(401).json({ error: 'Admin session expired' });
  if (req.method === 'PUT' && !requestIsSameOrigin(req)) {
    return res.status(403).json({ error: 'Invalid request origin' });
  }

  try {
    const sheets = getSheetsClient();
    const races = await getPublishedRaces(sheets);
    const raceId = req.method === 'PUT' ? String(req.body?.raceId || '') : requestedRaceId(req);

    if (!raceId) return res.status(200).json({ races });
    if (!races.some((race) => race.id === raceId)) {
      return res.status(404).json({ error: 'Published race not found' });
    }

    if (req.method === 'GET') {
      const content = await getRaceContent(sheets, process.env.RACE_REGISTRY_SHEET_ID, raceId);
      return res.status(200).json({ races, content });
    }

    const { content, errors } = validateRaceContent(req.body?.content);
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });
    const saved = await saveRaceContent(
      sheets,
      process.env.RACE_REGISTRY_SHEET_ID,
      raceId,
      content,
    );
    return res.status(200).json({ content: saved });
  } catch (error) {
    console.error('admin race content error', error);
    return res.status(500).json({ error: 'Unable to update race-day information' });
  }
}
