/**
 * @file src/lib/settings-service.ts
 * @description Module 6, Items 6.1 & 6.4: Secure and Auditable Settings Management.
 * This service is the single source of truth for all system settings.
 */

import { SystemSetting, SettingsAuditLog } from './types';
import { randomUUID } from 'crypto';

// --- Mock Database Tables ---
export let systemSettings: SystemSetting[] = [
    { key: 'tax.rate', value: '0.09', isSensitive: true, description: 'Current VAT rate', lastUpdatedAt: new Date().toISOString(), updatedBy: 'system' },
    { key: 'telegram.bot.token', value: 'mock_token_12345', isSensitive: true, description: 'Telegram Bot API Token', lastUpdatedAt: new Date().toISOString(), updatedBy: 'system' },
    { key: 'portal.title', value: 'MarFaNet Agent Portal', isSensitive: false, description: 'Public title for the agent portal', lastUpdatedAt: new Date().toISOString(), updatedBy: 'system' },
];

export let settingsAuditLog: SettingsAuditLog[] = [];

// Mock notification service
const sendAdminNotification = (setting: SystemSetting, oldValue: string) => {
    console.warn(`[ADMIN NOTIFICATION] Sensitive setting '${setting.key}' was changed from '${oldValue}' to '${setting.value}' by user '${setting.updatedBy}'.`);
};


export const SettingsService = {

  getSetting: (key: string): SystemSetting | undefined => {
    // In a real app, this would be cached (see Item 6.2)
    return systemSettings.find(s => s.key === key);
  },

  getAllSettings: () => {
    return systemSettings;
  },
  
  /**
   * Centralized method to update a system setting.
   */
  updateSetting: (
    key: string,
    newValue: string,
    actorUserId: string
  ): { success: boolean; message: string } => {
    
    const settingIndex = systemSettings.findIndex(s => s.key === key);
    if (settingIndex === -1) {
      return { success: false, message: `Setting with key '${key}' not found.` };
    }

    const setting = systemSettings[settingIndex];
    const oldValue = setting.value;

    if (oldValue === newValue) {
      return { success: true, message: "No changes detected." };
    }

    console.log(`[SettingsService] Updating setting '${key}' from '${oldValue}' to '${newValue}' by user '${actorUserId}'.`);

    // 1. Create Audit Log record (Item 6.1)
    const logEntry: SettingsAuditLog = {
      id: `log_${randomUUID()}`,
      settingKey: key,
      oldValue: oldValue,
      newValue: newValue,
      changedAt: new Date().toISOString(),
      changedBy: actorUserId,
    };
    settingsAuditLog.push(logEntry);

    // 2. Update the actual setting
    setting.value = newValue;
    setting.lastUpdatedAt = logEntry.changedAt;
    setting.updatedBy = actorUserId;

    // 3. Handle sensitive setting notification (Item 6.4)
    if (setting.isSensitive) {
      sendAdminNotification(setting, oldValue);
    }

    // 4. (Future) Invalidate cache (Item 6.2)
    // invalidateCache(key);

    return { success: true, message: "Setting updated successfully." };
  }
};
