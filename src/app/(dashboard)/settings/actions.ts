
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { sendTelegramInvoiceNotifications } from '@/ai/flows/telegram-invoice-notifications';
import { z } from 'zod';
import { getTelegramSettings, type TelegramSettings } from '@/lib/settings';
import { revalidatePath } from 'next/cache';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'telegram-settings.json');


const SaveSettingsSchema = z.object({
  botToken: z.string().optional(),
  chatId: z.string().min(1, { message: "شناسه چت پیش‌فرض الزامی است." }),
  messageTemplate: z.string().min(1, { message: "قالب پیام الزامی است." }),
});

export type SettingsFormState = {
  message: string;
  success: boolean;
  errors?: {
    chatId?: string[];
    messageTemplate?: string[];
  };
}

export async function saveTelegramSettingsAction(
    prevState: SettingsFormState,
    formData: FormData
): Promise<SettingsFormState> {
    const validatedFields = SaveSettingsSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'خطا در اعتبارسنجی ورودی‌ها.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
  try {
    const { botToken, chatId, messageTemplate } = validatedFields.data;

    if (botToken) {
      // In a real app: await saveSecret('TELEGRAM_BOT_TOKEN', botToken);
    }

    const newSettings: Omit<TelegramSettings, 'botToken'> = {
        chatId,
        messageTemplate,
    };

    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(newSettings, null, 2), 'utf-8');

    revalidatePath('/(dashboard)/settings');
    return { success: true, message: 'تنظیمات با موفقیت ذخیره شد.' };
  } catch (error) {
    console.error('Failed to save Telegram settings:', error);
    return { success: false, message: 'خطا در ذخیره سازی تنظیمات.' };
  }
}

export async function sendTestTelegramNotificationAction(chatId: string) {
  const settings = await getTelegramSettings();

  if (!settings.botToken) {
     return {
      success: false,
      message: 'توکن ربات تلگرام تنظیم نشده است. آن را در بخش مربوطه تنظیم و ذخیره کنید.',
    };
  }

  if (!chatId) {
    return {
      success: false,
      message: 'برای ارسال پیام تستی، شناسه چت الزامی است.',
    };
  }

  const result = await sendTelegramInvoiceNotifications({
    botToken: settings.botToken,
    chatId: chatId,
    messageTemplate: settings.messageTemplate,
    name: "تست سیستم",
    amount: 123456,
    portalLink: "https://example.com",
  });

  return result;
}
