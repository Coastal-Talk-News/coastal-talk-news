import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Time-based one-time passwords, RFC 6238 over RFC 4226 (HOTP). The parameters
 * are the ones every authenticator app assumes by default - SHA-1, six digits,
 * thirty-second steps - because changing any of them breaks Google
 * Authenticator, Microsoft Authenticator and Authy silently.
 */
const STEP_SECONDS = 30;
const DIGITS = 6;
/** 160 bits: the size RFC 4226 recommends for an HMAC-SHA-1 key. */
const SECRET_BYTES = 20;
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function encodeBase32(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

export function decodeBase32(text: string): Buffer {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of text.toUpperCase()) {
    const index = BASE32.indexOf(char);
    if (index === -1) throw new Error('Invalid base32 character.');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** A fresh secret, base32 encoded the way authenticator apps expect it. */
export function generateTotpSecret(): string {
  return encodeBase32(randomBytes(SECRET_BYTES));
}

export function stepAt(now: Date): number {
  return Math.floor(now.getTime() / 1000 / STEP_SECONDS);
}

export function totpCode(
  secret: Buffer,
  step: number,
  digits = DIGITS,
): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac('sha1', secret).update(counter).digest();
  const offset = (hmac[19] ?? 0) & 0x0f;
  const binary =
    (((hmac[offset] ?? 0) & 0x7f) << 24) |
    (((hmac[offset + 1] ?? 0) & 0xff) << 16) |
    (((hmac[offset + 2] ?? 0) & 0xff) << 8) |
    ((hmac[offset + 3] ?? 0) & 0xff);
  return String(binary % 10 ** digits).padStart(digits, '0');
}

/**
 * The time step a submitted code belongs to, allowing `window` steps either
 * side of now for clock drift, or null when it matches none of them.
 *
 * Every candidate is compared even after one matches, and each comparison is
 * constant-time, so how long this takes reveals nothing about which step (or
 * how many digits) were right.
 */
export function matchTotp(
  secret: Buffer,
  code: string,
  now = new Date(),
  window = 1,
): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const submitted = Buffer.from(code);
  const current = stepAt(now);
  let matched: number | null = null;
  for (let offset = -window; offset <= window; offset += 1) {
    const step = current + offset;
    const isMatch = timingSafeEqual(
      Buffer.from(totpCode(secret, step)),
      submitted,
    );
    if (isMatch && matched === null) matched = step;
  }
  return matched;
}

/** What the QR code encodes; the format is the de-facto Key Uri Format. */
export function otpauthUri(params: {
  secret: string;
  account: string;
  issuer: string;
}): string {
  const issuer = encodeURIComponent(params.issuer);
  const label = `${issuer}:${encodeURIComponent(params.account)}`;
  return `otpauth://totp/${label}?secret=${params.secret}&issuer=${issuer}&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`;
}
