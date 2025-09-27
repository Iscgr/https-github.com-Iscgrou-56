import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const DEFAULT_CACHE_MS = 5 * 60 * 1000; // 5 minutes

type ProviderSource = 'env' | 'file' | 'command';

type CachedSecret = {
  value: string;
  expiresAt?: number;
};

let cache: CachedSecret | null = null;

const getProvider = (): ProviderSource => {
  const raw = process.env.SETTINGS_SECRET_SOURCE?.toLowerCase();
  if (raw === 'file' || raw === 'command' || raw === 'env') {
    return raw;
  }
  return 'env';
};

const getCacheTtl = (): number | undefined => {
  const raw = process.env.SETTINGS_SECRET_CACHE_MS;
  if (!raw) return DEFAULT_CACHE_MS;
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed < 0) {
    console.warn('[secure-settings] SETTINGS_SECRET_CACHE_MS is invalid; using default cache window.');
    return DEFAULT_CACHE_MS;
  }
  if (parsed === 0) {
    return undefined;
  }
  return parsed;
};

const loadFromEnv = () => {
  const secret = process.env.SETTINGS_SECRET ?? process.env.SETTINGS_ENCRYPTION_KEY;
  if (!secret) {
    return null;
  }
  return secret;
};

const loadFromFile = () => {
  const filePath = process.env.SETTINGS_SECRET_FILE;
  if (!filePath) {
    throw new Error('SETTINGS_SECRET_FILE must be provided when SETTINGS_SECRET_SOURCE=file');
  }

  const resolved = resolve(filePath);
  const content = readFileSync(resolved, 'utf8').trim();
  if (!content) {
    throw new Error(`SETTINGS_SECRET_FILE at ${resolved} is empty`);
  }
  return content;
};

const loadFromCommand = () => {
  const command = process.env.SETTINGS_SECRET_COMMAND;
  if (!command) {
    throw new Error('SETTINGS_SECRET_COMMAND must be provided when SETTINGS_SECRET_SOURCE=command');
  }

  const output = execFileSync('/bin/sh', ['-c', command], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

  if (!output) {
    throw new Error('SETTINGS_SECRET_COMMAND returned empty output');
  }

  return output;
};

const loadSecret = (): string => {
  const provider = getProvider();
  switch (provider) {
    case 'file':
      return loadFromFile();
    case 'command':
      return loadFromCommand();
    case 'env':
    default:
      return loadFromEnv() ?? '';
  }
};

export const clearSettingsSecretCache = () => {
  cache = null;
};

export const getSettingsSecret = (): string => {
  const ttl = getCacheTtl();
  if (cache) {
    if (!ttl) {
      return cache.value;
    }

    if (cache.expiresAt && cache.expiresAt > Date.now()) {
      return cache.value;
    }
  }

  const secret = loadSecret();
  if (!secret) {
    return '';
  }

  cache = {
    value: secret,
    expiresAt: ttl ? Date.now() + ttl : undefined,
  };

  return secret;
};
