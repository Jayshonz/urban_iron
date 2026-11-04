export const CONTENT_SHEET_NAME = 'Athlete Portal Content';
export const CONTENT_HEADERS = [
  'race_id',
  'route_description',
  'route_url',
  'workout_description',
  'workout_url',
  'race_day_notes',
  'prep_guides_json',
  'offers_json',
  'updated_at',
];

const TEXT_LIMIT = 5000;
const NOTES_LIMIT = 8000;
const ITEM_TEXT_LIMIT = 1200;
const TITLE_LIMIT = 160;
const CODE_LIMIT = 80;
const MAX_PREP_GUIDES = 12;
const MAX_OFFERS = 20;

function cleanText(value, limit) {
  return String(value || '').replace(/\r\n/g, '\n').trim().slice(0, limit);
}

function cleanUrl(value) {
  const input = String(value || '').trim();
  if (!input) return '';
  if (input.length > 2048) return null;
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cleanPrepGuides(value, errors) {
  const items = parseList(value);
  if (items.length > MAX_PREP_GUIDES) errors.push(`Add no more than ${MAX_PREP_GUIDES} prep guides.`);
  return items.slice(0, MAX_PREP_GUIDES).flatMap((item, index) => {
    const title = cleanText(item?.title, TITLE_LIMIT);
    const description = cleanText(item?.description, ITEM_TEXT_LIMIT);
    const url = cleanUrl(item?.url);
    if (!title && !description && !item?.url) return [];
    if (!title) errors.push(`Prep guide ${index + 1} needs a title.`);
    if (!url) errors.push(`Prep guide ${index + 1} needs a valid https link.`);
    return [{ title, description, url: url || '' }];
  });
}

function cleanOffers(value, errors) {
  const items = parseList(value);
  if (items.length > MAX_OFFERS) errors.push(`Add no more than ${MAX_OFFERS} offers.`);
  return items.slice(0, MAX_OFFERS).flatMap((item, index) => {
    const partner = cleanText(item?.partner, TITLE_LIMIT);
    const title = cleanText(item?.title, TITLE_LIMIT);
    const description = cleanText(item?.description, ITEM_TEXT_LIMIT);
    const code = cleanText(item?.code, CODE_LIMIT);
    const url = cleanUrl(item?.url);
    const logoUrl = cleanUrl(item?.logoUrl);
    const active = item?.active !== false;
    if (!partner && !title && !description && !code && !item?.url && !item?.logoUrl) return [];
    if (!partner) errors.push(`Offer ${index + 1} needs a partner name.`);
    if (!title) errors.push(`Offer ${index + 1} needs a title.`);
    if (!url) errors.push(`Offer ${index + 1} needs a valid https destination.`);
    if (item?.logoUrl && !logoUrl) errors.push(`Offer ${index + 1} logo must be a valid https URL.`);
    return [{ partner, title, description, code, url: url || '', logoUrl: logoUrl || '', active }];
  });
}

export function validateRaceContent(input) {
  const errors = [];
  const content = {
    routeDescription: cleanText(input?.routeDescription, TEXT_LIMIT),
    routeUrl: cleanUrl(input?.routeUrl),
    workoutDescription: cleanText(input?.workoutDescription, TEXT_LIMIT),
    workoutUrl: cleanUrl(input?.workoutUrl),
    raceDayNotes: cleanText(input?.raceDayNotes, NOTES_LIMIT),
    prepGuides: cleanPrepGuides(input?.prepGuides, errors),
    offers: cleanOffers(input?.offers, errors),
  };
  if (content.routeUrl === null) errors.push('Route link must be a valid https URL.');
  if (content.workoutUrl === null) errors.push('Workout link must be a valid https URL.');
  return { content: { ...content, routeUrl: content.routeUrl || '', workoutUrl: content.workoutUrl || '' }, errors };
}

export function contentFromRow(row = []) {
  const { content } = validateRaceContent({
    routeDescription: row[1],
    routeUrl: row[2],
    workoutDescription: row[3],
    workoutUrl: row[4],
    raceDayNotes: row[5],
    prepGuides: parseList(row[6]),
    offers: parseList(row[7]),
  });
  return {
    raceId: String(row[0] || ''),
    ...content,
    updatedAt: String(row[8] || ''),
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
    JSON.stringify(content.prepGuides || []),
    JSON.stringify(content.offers || []),
    updatedAt,
  ];
}

export function publicRaceContent(content) {
  return {
    ...content,
    prepGuides: (content.prepGuides || []).filter((guide) => guide.title && guide.url),
    offers: (content.offers || []).filter(
      (offer) => offer.active !== false && offer.partner && offer.title && offer.url,
    ),
  };
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
      range: `'${CONTENT_SHEET_NAME}'!A2:I`,
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

export async function saveRaceContent(sheets, spreadsheetId, raceId, content) {
  const rows = await getContentRows(sheets, spreadsheetId);
  const index = rows.findIndex((row) => String(row[0] || '') === raceId);
  const row = contentToRow(raceId, content);
  if (index >= 0) {
    const sheetRow = index + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${CONTENT_SHEET_NAME}'!A${sheetRow}:I${sheetRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${CONTENT_SHEET_NAME}'!A:I`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });
  }
  return contentFromRow(row);
}
