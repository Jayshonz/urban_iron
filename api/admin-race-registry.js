import { requestHasAdminSession, requestHasAdminWriteOrigin } from './admin-auth.js';
import {
  adminRegistrySpreadsheetId,
  getAdminRaces,
  updateAdminRaceControls,
  validateRaceControlPatch,
} from './admin-race-registry-store.js';
import { getSheetsClient } from './race-registry.js';

export default async function handler(req, res) {
  if (!['GET', 'PATCH'].includes(req.method)) return res.status(405).end();
  res.setHeader('Cache-Control', 'no-store');
  if (!requestHasAdminSession(req)) return res.status(401).json({ error: 'Admin session expired' });
  if (req.method === 'PATCH' && !requestHasAdminWriteOrigin(req)) {
    return res.status(403).json({ error: 'Invalid request origin' });
  }

  const spreadsheetId = adminRegistrySpreadsheetId();
  if (!spreadsheetId) return res.status(503).json({ error: 'Admin race registry is not configured' });

  try {
    const sheets = getSheetsClient();
    if (req.method === 'GET') {
      const races = await getAdminRaces(sheets, spreadsheetId);
      return res.status(200).json({ races });
    }

    const raceId = String(req.body?.raceId || '').trim();
    if (!raceId) return res.status(400).json({ error: 'Choose a race to update' });
    const { patch, errors } = validateRaceControlPatch(req.body?.controls);
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });
    const race = await updateAdminRaceControls({ sheets, spreadsheetId, raceId, patch });
    if (!race) return res.status(404).json({ error: 'Race not found' });
    return res.status(200).json({ race });
  } catch (error) {
    console.error('admin race registry error', error);
    return res.status(500).json({ error: 'Unable to load the Urban Iron Race Registry' });
  }
}
