export const CONTENT_SHEET_NAME = 'Athlete Portal Content';
export const CONTENT_HEADERS = [
  'race_id',
  'route_description',
  'route_url',
  'workout_description',
  'workout_url',
  'race_day_notes',
  'updated_at',
];

const TEXT_LIMIT = 5000;
const NOTES_LIMIT = 8000;

function cleanText(value, limit) {
  return String(value || '').replace(/\r\n/g, '\n').trim().slice(0, limit);
}

function cleanUrl(value) {
  const input = String(value || '').trim();
  if (!input) return '';
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function validateRaceContent(input) {
  const content = {
    routeDescription: cleanText(input?.routeDescription, TEXT_LIMIT),
    routeUrl: cleanUrl(input?.routeUrl),
    workoutDescription: cleanText(input?.workoutDescription, TEXT_LIMIT),
    workoutUrl: cleanUrl(input?.workoutUrl),
    raceDayNotes: cleanText(input?.raceDayNotes, NOTES_LIMIT),
  };
  const errors = [];
  if (content.routeUrl === null) errors.push('Route link must be a valid https URL.');
  if (content.workoutUrl === null) errors.push('Workout link must be a valid https URL.');
  return { content: { ...content, routeUrl: content.routeUrl || '', workoutUrl: content.workoutUrl || '' }, errors };
}

export function contentFromRow(row = []) {
  return {
    raceId: String(row[0] || ''),
    routeDescription: String(row[1] || ''),
    routeUrl: String(row[2] || ''),
    workoutDescription: String(row[3] || ''),
    workoutUrl: String(row[4] || ''),
    raceDayNotes: String(row[5] || ''),
    updatedAt: String(row[6] || ''),
  };
}

export function emptyRaceContent(raceId) {
  return contentFromRow([raceId]);
}

export function findRaceContent(rows, raceId) {
  const match = (rows || []).find((row) => String(row[0] || '') === String(raceId || ''));
  return match ? contentFromRow(match) : emptyRaceContent(raceId);
}

export function contentToRow(raceId, content, updatedAt = new Date().toISOString()) {
  return [
    raceId,
    content.routeDescription,
    content.routeUrl,
    content.workoutDescription,
    content.workoutUrl,
    content.raceDayNotes,
    updatedAt,
  ];
}

function sheetMissing(error) {
  const status = Number(error?.code || error?.response?.status);
  const message = String(error?.message || error?.response?.data?.error?.message || '');
  return status === 400
    && message.includes(CONTENT_SHEET_NAME)
    && /unable to parse range|not found/i.test(message);
}

export async function getContentRows(sheets, spreadsheetId) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${CONTENT_SHEET_NAME}'!A2:G`,
    });
    return response.data.values || [];
  } catch (error) {
    if (sheetMissing(error)) return [];
    throw error;
  }
}

export async function getRaceContent(sheets, spreadsheetId, raceId) {
  return findRaceContent(await getContentRows(sheets, spreadsheetId), raceId);
}

async function ensureContentSheet(sheets, spreadsheetId) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties(title)',
  });
  const exists = (metadata.data.sheets || []).some(
    (sheet) => sheet.properties?.title === CONTENT_SHEET_NAME,
  );
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: CONTENT_SHEET_NAME } } }] },
    });
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${CONTENT_SHEET_NAME}'!A1:G1`,
    valueInputOption: 'RAW',
    requestBody: { values: [CONTENT_HEADERS] },
  });
}

export async function saveRaceContent(sheets, spreadsheetId, raceId, content) {
  await ensureContentSheet(sheets, spreadsheetId);
  const rows = await getContentRows(sheets, spreadsheetId);
  const index = rows.findIndex((row) => String(row[0] || '') === raceId);
  const row = contentToRow(raceId, content);
  if (index >= 0) {
    const sheetRow = index + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${CONTENT_SHEET_NAME}'!A${sheetRow}:G${sheetRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${CONTENT_SHEET_NAME}'!A:G`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });
  }
  return contentFromRow(row);
}
