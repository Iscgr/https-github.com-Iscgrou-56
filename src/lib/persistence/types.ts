import type { PrismaDbClient } from './prisma';
import type { Actor } from '../types';

export type PersistenceLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface PersistenceLogger {
  child?(metadata: Record<string, unknown>): PersistenceLogger;
  log(level: PersistenceLogLevel, message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
  debug(message: string, metadata?: Record<string, unknown>): void;
}

export type CorrelationContext = {
  correlationId?: string;
  actor: Actor;
};

export type RepositoryContext = CorrelationContext & {
  db: PrismaDbClient;
  logger: PersistenceLogger;
};

export interface Repository<T = unknown> {
  readonly ctx: RepositoryContext;
  readonly entity: string;
  audit(action: string, entityId: string, payload: Record<string, unknown>): Promise<void>;
  map(result: unknown): T;
}
