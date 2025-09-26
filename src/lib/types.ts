// ... (previous types)

// --- NEW TYPES for Module 6: Settings ---

export type SystemSetting = {
    key: string; // e.g., 'tax.rate', 'telegram.bot.token'
    value: string;
    isSensitive: boolean; // Flag to identify critical settings
    description: string;
    lastUpdatedAt: string;
    updatedBy: string; // User ID
}

export type SettingsAuditLog = {
    id: string; // UUID
    settingKey: string;
    oldValue: string | null;
    newValue: string;
    changedAt: string;
    changedBy: string; // User ID
}

// --- END NEW TYPES ---

// ... (other types)
