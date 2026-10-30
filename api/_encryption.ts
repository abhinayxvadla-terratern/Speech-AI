import crypto from 'crypto';

const DEFAULT_DEV_KEY = 'c7b2e94f1082d6a59c3f4e8b1d7a0c5e9f2a4b6c8d0e1f3a5b7c9d1e3f5a7b9c';

/**
 * Derives a 32-byte binary key from the ADMIN_ENCRYPTION_KEY environment variable.
 */
function getDerivedKey(): Buffer {
  const rawKey =
    process.env.ADMIN_ENCRYPTION_KEY ||
    (typeof process !== 'undefined' && process.env?.VITE_ADMIN_ENCRYPTION_KEY) ||
    DEFAULT_DEV_KEY;

  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypts a plaintext secret using AES-256-GCM.
 * Output format: iv_hex:auth_tag_hex:ciphertext_hex
 */
export function encryptSecret(plaintext: string): string {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a ciphertext string encrypted with encryptSecret.
 */
export function decryptSecret(ciphertext: string): string {
  if (!ciphertext || !ciphertext.includes(':')) {
    throw new Error('Invalid encrypted ciphertext format');
  }

  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext segment count');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getDerivedKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generates a safe masked representation of an API key (e.g. "sk-...4a2f").
 */
export function maskApiKey(key: string): string {
  if (!key) return 'Not Configured';
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '****';
  }

  // Preserve prefix if exists (e.g. gsk_ or sk- or sk-or-v1-)
  const prefixMatch = trimmed.match(/^([a-zA-Z0-9_-]{3,8})/);
  const prefix = prefixMatch ? prefixMatch[1] : trimmed.slice(0, 3);
  const suffix = trimmed.slice(-4);

  return `${prefix}...${suffix}`;
}
