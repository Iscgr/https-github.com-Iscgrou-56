import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

import { getSettingsSecret } from './settings-secret-provider';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';
const IV_LENGTH = 12; // 96 bits recommended for GCM

const resolveSecret = () => {
  const rawSecret = getSettingsSecret();
  if (rawSecret) {
    return createHash('sha256').update(rawSecret).digest();
  }

  const env = process.env.NODE_ENV ?? 'development';
  if (env === 'production') {
    throw new Error(
      'Secure settings provider did not return a secret. Configure SETTINGS_SECRET or managed provider.',
    );
  }

  console.warn(
    '[secure-settings] Using development-only secret. Configure SETTINGS_SECRET or SETTINGS_SECRET_SOURCE to secure sensitive settings.',
  );
  return createHash('sha256').update('development-only-secret').digest();
};

const splitPayload = (payload: string) => {
  const segments = payload.split(':');
  if (segments.length !== 4) {
    throw new Error('Invalid encrypted payload format.');
  }
  const [, iv, authTag, ciphertext] = segments;
  return {
    iv: Buffer.from(iv, 'base64'),
    authTag: Buffer.from(authTag, 'base64'),
    ciphertext: Buffer.from(ciphertext, 'base64'),
  };
};

export const encryptSettingValue = (value: string): string => {
  const key = resolveSecret();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [VERSION, iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
};

export const decryptSettingValue = (value: string | null | undefined): string | null => {
  if (!value) return value ?? null;
  if (!value.startsWith(`${VERSION}:`)) {
    // Legacy plain-text value
    return value;
  }

  const key = resolveSecret();
  const { iv, authTag, ciphertext } = splitPayload(value);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
};

export const maskSensitiveValue = (value: string | null | undefined): string => {
  if (!value) return '[EMPTY]';
  const trimmed = value.trim();
  if (!trimmed) return '[EMPTY]';
  if (trimmed.length <= 4) return '***';
  return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
};
