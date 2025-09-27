import { randomUUID } from 'crypto';

import { getRequiredAuditActor } from '../audit-context';
import { getFeatureFlagSnapshot, getRolloutStage } from '../feature-flags';
import { withSpan } from '../observability/tracing';
import type { Actor } from '../types';

import { prisma } from './prisma';
import type { RepositoryContext, PersistenceLogger, PersistenceLogLevel } from './types';
import { AgentRepository } from './repositories/agent-repository';
import { PartnerRepository } from './repositories/partner-repository';
import { InvoiceRepository } from './repositories/invoice-repository';
import { PaymentRepository } from './repositories/payment-repository';
import { WalletRepository } from './repositories/wallet-repository';
import { NotificationRepository } from './repositories/notification-repository';
import { SettingsRepository } from './repositories/settings-repository';
import { CommissionRepository } from './repositories/commission-repository';
import { UsageRepository } from './repositories/usage-repository';
import { AgentFinancialSummaryRepository } from './repositories/agent-financial-summary-repository';
import { PortalAppearanceRepository } from './repositories/portal-appearance-repository';

const SYSTEM_READ_ACTOR: Actor = {
  userId: 'system:read',
  role: 'system',
};

class RepositoryBundle {
  protected _agents?: AgentRepository;
  protected _partners?: PartnerRepository;
  protected _invoices?: InvoiceRepository;
  protected _payments?: PaymentRepository;
  protected _wallets?: WalletRepository;
  protected _notifications?: NotificationRepository;
  protected _settings?: SettingsRepository;
  protected _commissions?: CommissionRepository;
  protected _usage?: UsageRepository;
  protected _agentSummaries?: AgentFinancialSummaryRepository;
  protected _portalAppearance?: PortalAppearanceRepository;

  constructor(protected readonly ctx: RepositoryContext) {}

  get actor() {
    return this.ctx.actor;
  }

  get correlationId() {
    return this.ctx.correlationId;
  }

  get logger() {
    return this.ctx.logger;
  }

  get agents() {
    return (this._agents ??= new AgentRepository(this.ctx));
  }

  get partners() {
    return (this._partners ??= new PartnerRepository(this.ctx));
  }

  get invoices() {
    return (this._invoices ??= new InvoiceRepository(this.ctx));
  }

  get payments() {
    return (this._payments ??= new PaymentRepository(this.ctx));
  }

  get wallets() {
    return (this._wallets ??= new WalletRepository(this.ctx));
  }

  get notifications() {
    return (this._notifications ??= new NotificationRepository(this.ctx));
  }

  get settings() {
    return (this._settings ??= new SettingsRepository(this.ctx));
  }

  get commissions() {
    return (this._commissions ??= new CommissionRepository(this.ctx));
  }

  get usage() {
    return (this._usage ??= new UsageRepository(this.ctx));
  }

  get agentSummaries() {
    return (this._agentSummaries ??= new AgentFinancialSummaryRepository(this.ctx));
  }

  get portalAppearance() {
    return (this._portalAppearance ??= new PortalAppearanceRepository(this.ctx));
  }
}

export class UnitOfWork extends RepositoryBundle {}

const consoleByLevel: Record<PersistenceLogLevel, (message?: unknown, ...optional: unknown[]) => void> = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }
  return { message: String(error) };
};

export const createPersistenceLogger = (context: {
  correlationId: string;
  actor: Actor;
  metadata?: Record<string, unknown>;
}): PersistenceLogger => {
  const baseMetadata = {
    correlationId: context.correlationId,
    actor: context.actor.userId,
    ...(context.metadata ?? {}),
  } satisfies Record<string, unknown>;

  const log = (level: PersistenceLogLevel, message: string, metadata?: Record<string, unknown>) => {
    const emitter = consoleByLevel[level] ?? console.log.bind(console);
    emitter(
      `[persistence][${level.toUpperCase()}][${context.correlationId}] ${message}`,
      {
        ...baseMetadata,
        rolloutStage: getRolloutStage(),
        flagState: getFeatureFlagSnapshot(),
        ...(metadata ?? {}),
      },
    );
  };

  const logger: PersistenceLogger = {
    log,
    info: (message, metadata) => log('info', message, metadata),
    warn: (message, metadata) => log('warn', message, metadata),
    error: (message, metadata) => log('error', message, metadata),
    debug: (message, metadata) => log('debug', message, metadata),
    child: (metadata) =>
      createPersistenceLogger({
        correlationId: context.correlationId,
        actor: context.actor,
        metadata: { ...baseMetadata, ...(metadata ?? {}) },
      }),
  };

  return logger;
};

export async function withUnitOfWork<T>(
  fn: (unit: UnitOfWork) => Promise<T>,
  options?: { correlationId?: string },
): Promise<T> {
  const actor = getRequiredAuditActor();
  const correlationId = options?.correlationId ?? randomUUID();
  const logger = createPersistenceLogger({ correlationId, actor });

  const run = async (unitFactory: () => UnitOfWork, transactional?: boolean): Promise<T> => {
    return withSpan(
      'persistence.withUnitOfWork',
      {
        attributes: {
          'persistence.transactional': Boolean(transactional),
          'persistence.actor': actor.userId,
          'persistence.correlation_id': correlationId,
        },
      },
      async (span) => {
        logger.debug('withUnitOfWork.start', { transactional });
        try {
          const result = await fn(unitFactory());
          span.setAttribute('persistence.status', 'commit');
          logger.debug('withUnitOfWork.commit', { transactional });
          return result;
        } catch (error) {
          span.setAttribute('persistence.status', 'rollback');
          logger.error('withUnitOfWork.rollback', {
            transactional,
            error: normalizeError(error),
          });
          throw error;
        }
      },
    );
  };

  if (process.env.FAKE_PRISMA === '1') {
    const factory = (globalThis as { __FAKE_UOW_FACTORY?: (args: { actor: Actor; correlationId?: string }) => UnitOfWork }).__FAKE_UOW_FACTORY;
    if (!factory) {
      throw new Error('FAKE_PRISMA mode enabled but no __FAKE_UOW_FACTORY provided');
    }
    const unit = factory({ actor, correlationId });
    return run(() => unit, false);
  }

  return prisma.$transaction(async (tx) => {
    const ctx: RepositoryContext = {
      db: tx,
      actor,
      correlationId,
      logger,
    };

    return run(() => new UnitOfWork(ctx), true);
  });
}

export function getRepositories(options?: { correlationId?: string }) {
  const correlationId = options?.correlationId ?? randomUUID();
  const ctx: RepositoryContext = {
    db: prisma,
    actor: SYSTEM_READ_ACTOR,
    correlationId,
    logger: createPersistenceLogger({ correlationId, actor: SYSTEM_READ_ACTOR }),
  };

  return new RepositoryBundle(ctx);
}
