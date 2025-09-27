import { randomUUID } from 'crypto';

import type { Prisma } from '@/generated/prisma';

import { BaseRepository } from './base';

export class SettingsRepository extends BaseRepository {
  async getSetting(key: string) {
    return this.db.systemSetting.findUnique({ where: { key } });
  }

  async listSettings() {
    return this.db.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async updateSetting(
    key: string,
    data: Pick<Prisma.SystemSettingUpdateInput, 'value' | 'updatedBy' | 'description'>,
    options?: {
      auditOldValue?: string | null;
      auditNewValue?: string | null;
      payload?: Record<string, unknown>;
    },
  ) {
    const existing = await this.db.systemSetting.findUnique({ where: { key } });
    if (!existing) {
      throw new Error(`System setting '${key}' not found`);
    }

    const updated = await this.db.systemSetting.update({
      where: { key },
      data: {
        ...data,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    await this.db.settingsAuditLog.create({
      data: {
        id: randomUUID(),
        settingKey: key,
        oldValue: options?.auditOldValue ?? existing.value,
        newValue: options?.auditNewValue ?? (data.value as string),
        changedBy: this.actor.userId,
      },
    });

    const payload = options?.payload ?? {
      updatedBy: data.updatedBy,
      description: data.description,
      value: options?.auditNewValue ?? (data.value as string),
    };

    await this.writeAuditLog({
      entityType: 'SystemSetting',
      entityId: key,
      action: 'SETTING_UPDATED',
      payload,
    });

    return updated;
  }

  async seedDefaults(settings: Prisma.SystemSettingCreateManyInput[]) {
    if (!settings.length) return;
    await this.db.systemSetting.createMany({
      data: settings,
      skipDuplicates: true,
    });
  }
}
