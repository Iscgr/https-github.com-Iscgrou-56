import fs from 'fs';
import path from 'path';

import type {
  ConsoleLogEntry,
  EnvironmentSummary,
  ReporterOptions,
  SuiteRunSummary,
  TestResultRecord,
} from './types';

const sanitizeFilename = (input: string) => input.replace(/[^a-z0-9-_]/gi, '_');

export class TestReporter {
  private readonly runDir: string;

  private readonly screenshotsDir: string;

  private readonly logsDir: string;

  private readonly artifactsDir: string;

  private readonly results: TestResultRecord[] = [];

  private readonly startTime: number;

  private environment?: EnvironmentSummary;

  constructor(private readonly options: ReporterOptions) {
    this.startTime = options.startTime;
    const timestamp = new Date(this.startTime).toISOString().replace(/[:.]/g, '-');
    this.runDir = path.join(options.artifactsRoot, timestamp, sanitizeFilename(options.suiteName));
    this.screenshotsDir = path.join(this.runDir, 'screenshots');
    this.logsDir = path.join(this.runDir, 'logs');
    this.artifactsDir = path.join(this.runDir, 'artifacts');
    [this.runDir, this.screenshotsDir, this.logsDir, this.artifactsDir].forEach((dir) => {
      fs.mkdirSync(dir, { recursive: true });
    });

    if (options.environment) {
      this.environment = options.environment;
    }
  }

  setEnvironment(summary: EnvironmentSummary) {
    this.environment = summary;
  }

  record(result: TestResultRecord) {
    this.results.push(result);
  }

  recordConsoleLogs(testIdx: number, logs: ConsoleLogEntry[]) {
    if (!logs.length) return;

    const filename = path.join(this.logsDir, `${String(testIdx).padStart(3, '0')}-console.json`);
    fs.writeFileSync(filename, JSON.stringify(logs, null, 2), 'utf-8');
  }

  resolveScreenshotPath(name: string) {
    return path.join(this.screenshotsDir, sanitizeFilename(name));
  }

  resolveArtifactPath(name: string) {
    return path.join(this.artifactsDir, sanitizeFilename(name));
  }

  flush(metadata?: Record<string, unknown>) {
    const finishedAt = Date.now();
    const summary: SuiteRunSummary = {
      suite: this.options.suiteName,
      startedAt: new Date(this.startTime).toISOString(),
      finishedAt: new Date(finishedAt).toISOString(),
      durationMs: finishedAt - this.startTime,
      environment: this.environment ?? {
        baseUrl: 'unknown',
        startedAt: new Date(this.startTime).toISOString(),
        seedExecuted: false,
      },
      results: this.results,
      metadata,
    };

    const filePath = path.join(this.runDir, 'results.json');
    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2), 'utf-8');
  }
}
