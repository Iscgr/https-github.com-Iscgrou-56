import path from 'path';
import { fileURLToPath } from 'url';

import type { TestEnvironmentConfig } from './types';

const DEFAULT_PORT = Number(process.env.TEST_SERVER_PORT ?? 9002);

const resolveCwd = () => {
  if (process.env.TEST_PROJECT_ROOT) {
    return process.env.TEST_PROJECT_ROOT;
  }
  const filename = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(filename), '../..');
};

const artifactsRoot = process.env.TEST_ARTIFACTS_ROOT
  ? path.resolve(process.env.TEST_ARTIFACTS_ROOT)
  : path.join(process.cwd(), 'test-artifacts');

export const DEFAULT_ENVIRONMENT_CONFIG: TestEnvironmentConfig = {
  baseUrl: process.env.TEST_BASE_URL ?? `http://localhost:${DEFAULT_PORT}`,
  serverCommand: process.env.TEST_SERVER_COMMAND ?? 'npm run dev',
  serverReadyPath: process.env.TEST_SERVER_READY_PATH ?? '/api/internal/metrics',
  serverPort: DEFAULT_PORT,
  maxServerReadyAttempts: Number(process.env.TEST_SERVER_READY_ATTEMPTS ?? 60),
  serverReadyIntervalMs: Number(process.env.TEST_SERVER_READY_INTERVAL_MS ?? 1000),
  prismaSeedCommand: process.env.TEST_PRISMA_SEED_COMMAND ?? 'npm run db:seed',
  prismaSeedTimeoutMs: Number(process.env.TEST_PRISMA_SEED_TIMEOUT_MS ?? 120_000),
  cwd: resolveCwd(),
  artifactsRoot,
  skipServer: process.env.TEST_SKIP_SERVER === '1',
  skipSeed: process.env.TEST_SKIP_SEED === '1',
};
