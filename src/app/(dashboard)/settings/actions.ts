
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { sendTelegramInvoiceNotifications } from '@/ai/flows/telegram-invoice-notifications';
import { z } from 'zod';
import { getTelegramSettings, type TelegramSettings } from '@/lib/settings';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'telegram-settings.json');


const SaveTelegramSettingsSchema = z.object({
  botToken: z.string().optional(), // Token is optional, won't be overwritten if empty
  chatId: z.string(),
  messageTemplate: z.string(),
});

export async function saveTelegramSettings(settings: z.infer<typeof SaveTelegramSettingsSchema>) {
  try {
    const currentSettings = await getTelegramSettings();
    
    // Only update the bot token in the environment if a new one is provided.
    // In a real production environment, writing to process.env like this is not standard.
    // This is a simulation for the prototyping environment.
    if (settings.botToken) {
      process.env.TELEGRAM_BOT_TOKEN = settings.botToken;
       // In a real app, you'd have a more secure way to persist this, like a secret manager.
       // For this environment, we'll just update the env for the current process.
    }

    const newSettings: Omit<TelegramSettings, 'botToken'> = {
        chatId: settings.chatId,
        messageTemplate: settings.messageTemplate,
    };

    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(newSettings, null, 2), 'utf-8');

    return { success: true, message: 'تنظیمات با موفقیت ذخیره شد.' };
  } catch (error) {
    console.error('Failed to save Telegram settings:', error);
    return { success: false, message: 'خطا در ذخیره سازی تنظیمات.' };
  }
}


const TestTelegramInputSchema = z.object({
  chatId: z.string().optional(),
  messageTemplate: z.string(),
});

type TestTelegramInput = z.infer<typeof TestTelegramInputSchema>;

export async function sendTestTelegramNotification(input: TestTelegramInput) {
  const settings = await getTelegramSettings();

  const targetChatId = input.chatId || settings.chatId;

  if (!settings.botToken) {
     return {
      success: false,
      message: 'توکن ربات تلگرام تنظیم نشده است. لطفا آن را در صفحه تنظیمات وارد کنید.',
    };
  }

  if (!targetChatId) {
    return {
      success: false,
      message: 'برای ارسال پیام تستی، شناسه چت الزامی است. آن را در فیلد مربوطه وارد کنید.',
    };
  }

  const result = await sendTelegramInvoiceNotifications({
    botToken: settings.botToken,
    chatId: targetChatId,
    messageTemplate: input.messageTemplate,
    name: "تست سیستم",
    amount: 123456,
    portalLink: "https://example.com",
  });

  return result;
}

