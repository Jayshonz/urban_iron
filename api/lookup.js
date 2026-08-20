import { getContext, getLookupRows, mapParticipant, norm } from './data.js';
import { verifyRaceSession } from './session.js';

function editDistance(a, b) {
  const x = norm(a); const y = norm(b);
  if (!x || !y) return Math.max(x.length, y.length);
  const row = Array.from({ length: y.length + 1 }, (_, i) => i);
  for (let i = 1; i <= x.length; i += 1) {
    let prev = row[0]; row[0] = i;
    for (let j = 1; j <= y.length; j += 1) {
      const hold = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (x[i - 1] === y[j - 1] ? 0 : 1));
      prev = hold;
    }
  }
  return row[y.length];
}

function scoreRow(row, q) {
  const first = norm(row[0]);
  const last = norm(row[1]);
  const email = norm(row[2]);
  const full = norm(`${row[0]} ${row[1]}`);
  const values = [full, first, last, email];
  if (values.some((v) => v === q)) return 100;
  if (values.some((v) => v.startsWith(q))) return 90;
  if (values.some((v) => v.includes(q))) return 80;

  // Light typo tolerance for names only. Avoid overly broad email fuzzy matches.
  const nameCandidates = [first, last, full].filter(Boolean);
  const best = Math.min(...nameCandidates.map((v) => editDistance(v, q)));
  const limit = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;
  if (best <= limit) return 60 - best;
  return 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { raceId, accessToken, query } = req.body || {};
    const q = norm(query);
    if (!raceId || !accessToken || !q) return res.status(400).json({ error: 'Enter a name or email' });

    const context = await getContext(raceId);
    if (context.error) return res.status(context.error.status).json({ error: context.error.message });
    if (!verifyRaceSession(accessToken, raceId, context.password)) {
      return res.status(401).json({ error: 'Session expired. Enter the race password again.' });
    }

    const rows = await getLookupRows(context.sheets, context.spreadsheetId);
    const results = rows
      .map((row) => ({ row, score: scoreRow(row, q) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || norm(`${a.row[0]} ${a.row[1]}`).localeCompare(norm(`${b.row[0]} ${b.row[1]}`)))
      .slice(0, 20)
      .map((item) => mapParticipant(item.row));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ results });
  } catch (error) {
    console.error('lookup error', error);
    return res.status(500).json({ error: 'Lookup unavailable' });
  }
}
