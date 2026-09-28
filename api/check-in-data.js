import { norm } from './data.js';

function isYes(value) {
  return ['yes', 'true', '1', 'on', 'checked'].includes(norm(value));
}

function firstHeaderIndex(headers, aliases) {
  for (const alias of aliases) {
    const index = headers.indexOf(alias);
    if (index >= 0) return index;
  }
  return -1;
}

function columnLetter(index) {
  let n = index + 1;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

export async function getCheckInEnabled(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.RACE_REGISTRY_SHEET_ID,
    range: "'Race Registry'!A2:K",
  });
  return response.data.values || [];
}

export function raceCheckInEnabled(rows, raceId) {
  const race = rows.find((row) => row[0] === raceId);
  return Boolean(race && isYes(race[10]));
}

export async function getCheckInData(sheets, spreadsheetId) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'Check-in Morning'!A1:Z",
  });

  const values = response.data.values || [];
  const headers = (values[0] || []).map(norm);
  const indexes = {
    first: firstHeaderIndex(headers, ['first', 'first name']),
    last: firstHeaderIndex(headers, ['last', 'last name']),
    name: firstHeaderIndex(headers, ['name', 'participant', 'participant name']),
    bib: firstHeaderIndex(headers, ['bib', 'bib #', 'bib number', 'bib#']),
    checked: firstHeaderIndex(headers, ['checked in', 'check in', 'check-in', 'checked-in', 'checkin']),
  };

  if (indexes.checked < 0) throw new Error('Check-in Morning needs a Checked In / Check In column');

  return {
    indexes,
    rows: values.slice(1).map((row, i) => ({ row, sheetRow: i + 2 })),
  };
}

export function findCheckInParticipant(checkInData, participant) {
  const { indexes, rows } = checkInData;
  const targetBib = norm(participant.bib);
  const targetFirst = norm(participant.first);
  const targetLast = norm(participant.last);
  const targetFull = norm(`${participant.first} ${participant.last}`);

  if (targetBib && indexes.bib >= 0) {
    const byBib = rows.find(({ row }) => norm(row[indexes.bib]) === targetBib);
    if (byBib) return byBib;
  }

  return rows.find(({ row }) => {
    if (indexes.name >= 0 && norm(row[indexes.name]) === targetFull) return true;
    return indexes.first >= 0 && indexes.last >= 0
      && norm(row[indexes.first]) === targetFirst
      && norm(row[indexes.last]) === targetLast;
  }) || null;
}

export function checkedInFromMatch(checkInData, match) {
  return Boolean(match && isYes(match.row[checkInData.indexes.checked]));
}

export async function setCheckedIn(sheets, spreadsheetId, checkInData, match) {
  const cell = `'Check-in Morning'!${columnLetter(checkInData.indexes.checked)}${match.sheetRow}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cell,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[true]] },
  });
}
