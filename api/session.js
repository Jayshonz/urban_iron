import crypto from 'node:crypto';

const norm = (value) => String(value || '').trim();

export function safeEqual(a, b) {
  const aHash = crypto.createHash('sha256').update(String(a)).digest();
  const bHash = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(aHash, bHash);
}

function signingKey(raceId, password) {
  return crypto.createHash('sha256').update(`${raceId}\n${password}`).digest();
}

export function createRaceSession(raceId, password, ttlSeconds = 4 * 60 * 60) {
  const payload = {
    raceId: norm(raceId),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', signingKey(raceId, password))
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyRaceSession(token, raceId, password) {
  try {
    const [encoded, signature] = String(token || '').split('.');
    if (!encoded || !signature) return false;
    const expected = crypto
      .createHmac('sha256', signingKey(raceId, password))
      .update(encoded)
      .digest('base64url');
    if (!safeEqual(signature, expected)) return false;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return payload.raceId === norm(raceId) && Number(payload.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
