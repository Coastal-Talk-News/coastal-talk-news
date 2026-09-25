import { randomBytes } from 'node:crypto';

export const RECOVERY_CODE_COUNT = 10;
const CODE_LENGTH = 10;
/** 32 symbols, so one random byte maps evenly; no I, O, 0 or 1 to misread. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SHAPE = /^[A-HJ-NP-Z2-9]{10}$/;

/** Ten characters (50 bits), shown as XXXXX-XXXXX. */
export function generateRecoveryCode(): string {
  const chars = [...randomBytes(CODE_LENGTH)].map(
    (byte) => ALPHABET[byte & 31],
  );
  return `${chars.slice(0, 5).join('')}-${chars.slice(5).join('')}`;
}

/** What a person typed, reduced to what was stored: case, dashes and spaces don't matter. */
export function normalizeRecoveryCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function looksLikeRecoveryCode(normalized: string): boolean {
  return SHAPE.test(normalized);
}
