/**
 * @file src/lib/settings-service.ts
 * @description Module 6, Items 6.1 & 6.4: Secure and Auditable Settings Management.
 * This service is the single source of truth for all system settings.
 */

import { getRepositories, withUnitOfWork } from './persistence/unit-of-work';
import { METRIC_SETTINGS_RESULTS, recordSettingsUpdate } from './observability/metrics';
import {
  decryptSettingValue,
  encryptSettingValue,
  maskSensitiveValue,
} from './security/secure-settings';

// Mock notification service
const sendAdminNotification = (
  setting: { key: string; value: string; updatedBy: string },
  oldValue: string,
) => {
  console.warn(
    `[ADMIN NOTIFICATION] Sensitive setting '${setting.key}' was changed from '${oldValue}' to '${setting.value}' by user '${setting.updatedBy}'.`,
  );
};


export const SettingsService = {

  async getSetting(key: string) {
    const repositories = getRepositories();
    const setting = await repositories.settings.getSetting(key);
    if (!setting) return null;

    const resolvedValue = setting.isSensitive ? decryptSettingValue(setting.value) : setting.value;
    return {
      ...setting,
      value: resolvedValue ?? '',
    };
  },

  async getAllSettings() {
    const repositories = getRepositories();
    const settings = await repositories.settings.listSettings();
    return settings.map((setting) => ({
      ...setting,
      value: (setting.isSensitive ? decryptSettingValue(setting.value) : setting.value) ?? '',
    }));
  },
  
  /**
   * Centralized method to update a system setting.
   */
  updateSetting: async (
    key: string,
    newValue: string,
    actorUserId: string
  ): Promise<{ success: boolean; message: string }> => {
    return withUnitOfWork(async (unit) => {
      const setting = await unit.settings.getSetting(key);

      if (!setting) {
        recordSettingsUpdate(METRIC_SETTINGS_RESULTS.FAILURE);
        return { success: false, message: `Setting with key '${key}' not found.` };
      }

      const resolvedExisting = setting.isSensitive ? decryptSettingValue(setting.value) : setting.value;
      const existingValue = resolvedExisting ?? '';

      if (existingValue === newValue) {
        recordSettingsUpdate(METRIC_SETTINGS_RESULTS.NOOP);
        return { success: true, message: 'No changes detected.' };
      }

      console.log(
        `[SettingsService] Updating setting '${key}' from '${setting.isSensitive ? '[REDACTED]' : existingValue}' to '${
          setting.isSensitive ? '[REDACTED]' : newValue
        }' by user '${actorUserId}'.`,
      );

      const storedValue = setting.isSensitive ? encryptSettingValue(newValue) : newValue;
      const auditOldValue = setting.isSensitive ? maskSensitiveValue(existingValue) : existingValue;
      const auditNewValue = setting.isSensitive ? maskSensitiveValue(newValue) : newValue;

      const updatedSetting = await unit.settings.updateSetting(
        key,
        {
          value: storedValue,
          updatedBy: actorUserId,
          description: setting.description ?? undefined,
        },
        {
          auditOldValue,
          auditNewValue,
          payload: {
            updatedBy: actorUserId,
            description: setting.description ?? undefined,
            value: setting.isSensitive ? '[REDACTED]' : newValue,
          },
        },
      );

      if (updatedSetting.isSensitive) {
        sendAdminNotification(
          {
            key: updatedSetting.key,
            value: newValue,
            updatedBy: actorUserId,
          },
          existingValue,
        );
      }

      recordSettingsUpdate(METRIC_SETTINGS_RESULTS.SUCCESS);
      return { success: true, message: 'Setting updated successfully.' };
    }).catch((error) => {
      recordSettingsUpdate(METRIC_SETTINGS_RESULTS.FAILURE);
      throw error;
    });
  }
};
