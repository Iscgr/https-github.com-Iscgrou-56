import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import chalk from 'chalk';
import fetch from 'node-fetch';

import { DEFAULT_ENVIRONMENT_CONFIG } from './config';
import type {
  EnvironmentSummary,
  TestEnvironmentConfig,
  TestEnvironmentContext,
} from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface SpawnOptions {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  inheritStdio?: boolean;
}

const runCommand = (command: string, options: SpawnOptions): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      shell: true,
      stdio: options.inheritStdio ? 'inherit' : 'pipe',
    });

    const timeout = options.timeoutMs
      ? setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`Command timed out after ${options.timeoutMs}ms: ${command}`));
        }, options.timeoutMs)
      : null;

    const logBuffer: string[] = [];

    if (!options.inheritStdio) {
      child.stdout?.on('data', (chunk) => {
        const text = chunk.toString();
        logBuffer.push(text);
        process.stdout.write(text);
      });
      child.stderr?.on('data', (chunk) => {
        const text = chunk.toString();
        logBuffer.push(text);
        process.stderr.write(text);
      });
    }

    child.on('exit', (code) => {
      if (timeout) clearTimeout(timeout);
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Command failed with exit code ${code}: ${command}\n${logBuffer.join('')}`,
          ),
        );
      }
    });

    child.on('error', reject);
  });

const startPersistentCommand = (command: string, options: SpawnOptions) => {
  const child = spawn(command, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    shell: true,
    stdio: 'pipe',
  });

  child.stdout?.on('data', (chunk) => {
    process.stdout.write(chalk.gray(`[server] ${chunk.toString()}`));
  });
  child.stderr?.on('data', (chunk) => {
    process.stderr.write(chalk.red(`[server] ${chunk.toString()}`));
  });

  child.on('exit', (code, signal) => {
    if (code !== 0 && signal !== 'SIGTERM') {
      process.stderr.write(
        chalk.red(`Test server exited unexpectedly (code=${code}, signal=${signal})\n`),
      );
    }
  });

  return child;
};

const terminateProcess = async (child: ChildProcess | null) => {
  if (!child || child.killed) return;

  const pid = child.pid;
  if (pid) {
  child.kill('SIGTERM');
    for (let attempt = 0; attempt < 10; attempt += 1) {
      if (child.killed || child.exitCode != null) {
        return;
      }
      await delay(250);
    }
    child.kill('SIGKILL');
  }
};

export class TestEnvironmentManager {
  private readonly config: TestEnvironmentConfig;

  private context: TestEnvironmentContext | null = null;

  private seedExecuted = false;

  constructor(overrides: Partial<TestEnvironmentConfig> = {}) {
    this.config = {
      ...DEFAULT_ENVIRONMENT_CONFIG,
      ...overrides,
    };
  }

  async setup(): Promise<TestEnvironmentContext> {
    const environment: EnvironmentSummary = {
      baseUrl: this.config.baseUrl,
      serverCommand: this.config.serverCommand,
      readyEndpoint: new URL(this.config.serverReadyPath, this.config.baseUrl).toString(),
      seedCommand: this.config.prismaSeedCommand,
      startedAt: new Date().toISOString(),
      seedExecuted: false,
    };

    if (!this.config.skipSeed && this.config.prismaSeedCommand) {
      process.stdout.write(chalk.cyan(`\n🧪 Running database seed: ${this.config.prismaSeedCommand}\n`));
      await runCommand(this.config.prismaSeedCommand, {
        cwd: this.config.cwd,
        timeoutMs: this.config.prismaSeedTimeoutMs,
        inheritStdio: true,
      });
      this.seedExecuted = true;
      environment.seedExecuted = true;
    }

    let serverProcess: ReturnType<typeof startPersistentCommand> | null = null;

    if (!this.config.skipServer && this.config.serverCommand) {
      process.stdout.write(chalk.cyan(`\n🚀 Starting test server: ${this.config.serverCommand}\n`));
      serverProcess = startPersistentCommand(this.config.serverCommand, {
        cwd: this.config.cwd,
        env: {
          ...process.env,
          PORT: String(this.config.serverPort),
          TZ: process.env.TZ ?? 'Asia/Tehran',
        },
      });

      await this.waitForServer();
    }

    this.context = {
      config: this.config,
      environment,
      serverProcess,
    };

    return this.context;
  }

  async waitForServer() {
    const { baseUrl, serverReadyPath, maxServerReadyAttempts, serverReadyIntervalMs } = this.config;
    const readyUrl = new URL(serverReadyPath, baseUrl);

    for (let attempt = 0; attempt < maxServerReadyAttempts; attempt += 1) {
      try {
        const response = await fetch(readyUrl.toString(), { method: 'GET' });
        if (response.ok) {
          process.stdout.write(chalk.green(`✅ Server ready at ${readyUrl.toString()}\n`));
          return;
        }
      } catch (error) {
        // ignore until retries exhausted
      }

      await delay(serverReadyIntervalMs);
    }

    throw new Error(`Server not ready after ${maxServerReadyAttempts} attempts at ${readyUrl.toString()}`);
  }

  async teardown() {
    if (!this.context?.serverProcess) return;
    await terminateProcess(this.context.serverProcess);
    this.context = null;
  }

  getContext(): TestEnvironmentContext | null {
    return this.context;
  }

  async withEnvironment<T>(fn: (context: TestEnvironmentContext) => Promise<T>): Promise<T> {
    const context = await this.setup();
    try {
      return await fn(context);
    } finally {
      await this.teardown();
    }
  }
}
