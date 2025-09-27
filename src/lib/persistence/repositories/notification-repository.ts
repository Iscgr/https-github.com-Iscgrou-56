import { randomUUID } from 'crypto';

import { NotificationStatus, NotificationType } from '@/generated/prisma';

import { BaseRepository } from './base';

export class NotificationRepository extends BaseRepository {
  async logSend(params: {
    invoiceId: string;
    type: NotificationType;
    status: NotificationStatus;
    errorMessage?: string | null;
  }) {
    const { invoiceId, type, status, errorMessage = null } = params;

    const log = await this.db.notificationLog.create({
      data: {
        id: randomUUID(),
        invoiceId,
        type,
        status,
        errorMessage,
      },
    });

    await this.writeAuditLog({
      entityType: 'Notification',
      entityId: log.id,
      action: 'NOTIFICATION_LOGGED',
      payload: params,
    });

    return log;
  }

  async findRecent(invoiceId: string, type: NotificationType, since: Date) {
    return this.db.notificationLog.findFirst({
      where: {
        invoiceId,
        type,
        sentAt: {
          gt: since,
        },
      },
      orderBy: { sentAt: 'desc' },
    });
  }
}
