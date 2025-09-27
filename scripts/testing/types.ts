import type { ChildProcess } from 'child_process';

export type TestStatus = 'PASS' | 'FAIL' | 'SKIP';

export type ConsoleSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface ConsoleLogEntry {
  severity: ConsoleSeverity;
  type: string;
  text: string;
  location?: string;
  page?: string;
  timestamp: string;
}

export interface TestResultRecord {
  module: string;
  test: string;
  status: TestStatus;
  duration: number;
  error?: string;
  details?: unknown;
  console?: ConsoleLogEntry[];
  screenshots?: string[];
  artifacts?: string[];
}

export interface EnvironmentSummary {
  baseUrl: string;
  serverCommand?: string | null;
  readyEndpoint?: string;
  seedCommand?: string | null;
  startedAt: string;
  seedExecuted: boolean;
}

export interface SuiteRunSummary {
  suite: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  environment: EnvironmentSummary;
  results: TestResultRecord[];
  metadata?: Record<string, unknown>;
}

export interface TestEnvironmentConfig {
  baseUrl: string;
  serverCommand: string | null;
  serverReadyPath: string;
  serverPort: number;
  maxServerReadyAttempts: number;
  serverReadyIntervalMs: number;
  prismaSeedCommand: string | null;
  prismaSeedTimeoutMs: number;
  cwd: string;
  artifactsRoot: string;
  skipServer?: boolean;
  skipSeed?: boolean;
}

export interface TestEnvironmentContext {
  config: TestEnvironmentConfig;
  environment: EnvironmentSummary;
  serverProcess: ChildProcess | null;
}

export interface ReporterOptions {
  suiteName: string;
  artifactsRoot: string;
  startTime: number;
  environment?: EnvironmentSummary;
}
