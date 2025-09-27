
'use server';

import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'telegram-settings.json');

export type TelegramSettings = {
    botToken: string;
    chatId: string;
    messageTemplate: string;
};

/**
 * Retrieves Telegram settings.
 * The bot token is read from environment variables for security.
 * The rest of the settings are read from a JSON file.
 */
export async function getTelegramSettings(): Promise<TelegramSettings> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';

  try {
    const data = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
    const settingsFromFile = JSON.parse(data);
    return {
      botToken,
      chatId: settingsFromFile.chatId || '',
      messageTemplate: settingsFromFile.messageTemplate || '',
    };
  } catch {
    // If the file doesn't exist or is invalid, return default values
    return {
      botToken,
      chatId: '',
      messageTemplate: "نماینده گرامی {{name}}، فاکتور جدید شما به مبلغ {{amount}} تومان در پورتال شما ثبت شد. لینک مشاهده: {{portalLink}}",
    };
  }
}
