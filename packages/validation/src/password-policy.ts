import { PASSWORD_MIN_LENGTH } from './limits.js';

export interface PasswordRule {
  id: 'length' | 'uppercase' | 'lowercase' | 'number' | 'special';
  /** Shown to the person choosing the password, and reused in the API's error. */
  label: string;
  test: (password: string) => boolean;
}

/**
 * The one definition of an acceptable password. The API enforces it and the
 * CMS draws it as a live checklist, so the two can never disagree about what
 * is allowed. Unicode-aware on purpose: a Kannada letter is a letter, not a
 * "special character", and é is a lowercase letter.
 */
export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: 'length',
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    test: (password) => /\p{Lu}/u.test(password),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    test: (password) => /\p{Ll}/u.test(password),
  },
  {
    id: 'number',
    label: 'One number',
    test: (password) => /\p{Nd}/u.test(password),
  },
  {
    id: 'special',
    label: 'One special character (! @ # $ …)',
    // Anything that is not a letter, digit, combining mark or whitespace. A
    // space alone must not count, and neither must the marks that are part of
    // ordinary Kannada words (the virama in ಕ್ಕ, a vowel sign) - otherwise any
    // Kannada word would satisfy this rule without containing a symbol.
    test: (password) => /[^\p{L}\p{N}\p{M}\s]/u.test(password),
  },
];

/** The rules a password does not yet meet. Empty means it is acceptable. */
export function unmetPasswordRules(password: string): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password));
}
