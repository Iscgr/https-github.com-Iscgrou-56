
'use server';

import { sendTelegramInvoiceNotifications } from '@/ai/flows/telegram-invoice-notifications';
import { z } from 'zod';

const TestTelegramInputSchema = z.object({
  botToken: z.string(),
  chatId: z.string().optional(),
  messageTemplate: z.string(),
});

type TestTelegramInput = z.infer<typeof TestTelegramInputSchema>;

export async function sendTestTelegramNotification(input: TestTelegramInput) {

  const targetChatId = input.chatId || process.env.TELEGRAM_DEFAULT_CHAT_ID;

  if (!targetChatId) {
    return {
      success: false,
      message: 'برای ارسال پیام تستی، شناسه چت الزامی است. آن را در فیلد مربوطه وارد کنید.',
    };
  }

  const result = await sendTelegramInvoiceNotifications({
    botToken: input.botToken,
    chatId: targetChatId,
    messageTemplate: input.messageTemplate,
    name: "تست سیستم",
    amount: 123456,
    portalLink: "https://example.com",
  });

  return result;
}
