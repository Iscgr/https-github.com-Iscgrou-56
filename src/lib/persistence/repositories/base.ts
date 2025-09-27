import { randomUUID } from 'crypto';

import type { Prisma } from '@/generated/prisma';

import type { RepositoryContext } from '../types';

export abstract class BaseRepository<T = unknown> {
  constructor(protected readonly ctx: RepositoryContext) {}

  protected get db() {
    return this.ctx.db;
  }

  protected get actor() {
    return this.ctx.actor;
  }

  protected async writeAuditLog(params: {
    entityType: string;
    entityId: string;
    action: string;
    payload?: Record<string, unknown>;
  }) {
    const { entityType, entityId, action, payload = {} } = params;
    const jsonPayload = payload as Prisma.JsonObject;
    const correlationId = this.ctx.correlationId ?? randomUUID();

    await this.db.auditLog.create({
      data: {
        id: randomUUID(),
        entityType,
        entityId,
        action,
        actorUserId: this.actor.userId,
        correlationId,
  payload: jsonPayload,
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected map(result: unknown): T {
    return result as T;
  }
}
