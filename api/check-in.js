import {
  checkedInFromMatch,
  findCheckInParticipant,
  getCheckInData,
  getCheckInEnabled,
  raceCheckInEnabled,
  setCheckedIn,
} from './check-in-data.js';
import { getContext, getLookupRows, mapParticipant, norm } from './data.js';
import { safeEqual, verifyRaceSession } from './session.js';

function sameParticipant(person, input) {
  return norm(person.bib) === norm(input.bib)
    && norm(person.first) === norm(input.first)
    && norm(person.last) === norm(input.last);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { raceId, accessToken, first, last, bib, pin } = req.body || {};
    if (!raceId || !accessToken || !first || !last || !bib) {
      return res.status(400).json({ error: 'Missing participant information' });
    }
    if (raceId === 'la-2026-10-04' && !safeEqual(pin, '104')) {
      return res.status(401).json({ error: 'Invalid team PIN' });
    }

    const context = await getContext(raceId);
    if (context.error) return res.status(context.error.status).json({ error: context.error.message });

    if (!verifyRaceSession(accessToken, raceId, context.password)) {
      return res.status(401).json({ error: 'Session expired. Enter the race password again.' });
    }

    const registryRows = await getCheckInEnabled(context.sheets);
    if (!raceCheckInEnabled(registryRows, raceId)) {
      return res.status(403).json({ error: 'Check-in is not currently open for this race.' });
    }

    const lookupRows = await getLookupRows(context.sheets, context.spreadsheetId);
    const participant = lookupRows.map(mapParticipant).find((person) =>
      sameParticipant(person, { first, last, bib }),
    );
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    const checkInData = await getCheckInData(context.sheets, context.spreadsheetId);
    const match = findCheckInParticipant(checkInData, participant);
    if (!match) return res.status(404).json({ error: 'Participant not found on Check-in Morning' });

    if (!checkedInFromMatch(checkInData, match)) {
      await setCheckedIn(context.sheets, context.spreadsheetId, checkInData, match);
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ checkedIn: true });
  } catch (error) {
    console.error('check-in error', error);
    return res.status(500).json({ error: 'Unable to complete check-in' });
  }
}
