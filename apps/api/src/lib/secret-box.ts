import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

const VERSION = 'v1';
const IV_BYTES = 12;

/**
 * Seals values that must be recoverable (an authenticator secret) and hashes
 * ones that must not be (a recovery code), both under keys derived from the one
 * configured master key. Encryption and hashing get separate subkeys, so a
 * weakness in how one is used can't be turned against the other.
 *
 * Sealed values carry a version prefix so the format can change - or the key
 * rotate - later without guessing what an old row contains.
 */
export class SecretBox {
  private readonly encryptionKey: Buffer;
  private readonly hashKey: Buffer;

  constructor(masterKey: Buffer) {
    const derive = (purpose: string) =>
      Buffer.from(
        hkdfSync('sha256', masterKey, Buffer.alloc(0), `ctn:${purpose}`, 32),
      );
    this.encryptionKey = derive('secret-box:encrypt');
    this.hashKey = derive('secret-box:hash');
  }

  /** AES-256-GCM: confidential, and tampering with the stored value is detected. */
  seal(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    return [VERSION, iv, cipher.getAuthTag(), ciphertext]
      .map((part) =>
        typeof part === 'string' ? part : part.toString('base64url'),
      )
      .join('.');
  }

  open(sealed: string): string {
    const [version, iv, tag, ciphertext] = sealed.split('.');
    if (version !== VERSION || !iv || !tag || !ciphertext) {
      throw new Error('Unrecognised sealed value.');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(iv, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  /**
   * Keyed, so a stolen copy of the table can't be brute-forced offline without
   * the server's key - which a plain SHA-256 of a short code could be.
   */
  digest(value: string): string {
    return createHmac('sha256', this.hashKey).update(value).digest('base64url');
  }
}
