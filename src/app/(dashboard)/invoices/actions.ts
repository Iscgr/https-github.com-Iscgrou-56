
'use server';

import { validateAndAggregateUsageData } from '@/ai/flows/validate-and-aggregate-usage-data';
import { sendTelegramInvoiceNotifications } from '@/ai/flows/telegram-invoice-notifications';
import { agents } from '@/lib/data';
import type { Invoice } from '@/lib/types';
import { z } from 'zod';
import { getTelegramSettings } from '@/lib/settings';

const ProcessUsageFileInputSchema = z.object({
  jsonData: z.string(),
  processedHashes: z.array(z.string()).optional(),
});
type ProcessUsageFileInput = z.infer<typeof ProcessUsageFileInputSchema>;

export async function processUsageFile(input: ProcessUsageFileInput) {
  const validationResult = await validateAndAggregateUsageData({
    jsonData: input.jsonData,
    processedHashes: input.processedHashes,
  });

  if (validationResult.validationErrors && validationResult.validationErrors.length > 0) {
    return { errors: validationResult.validationErrors, newInvoices: [] };
  }

  const newInvoices: Invoice[] = [];

  for (const agentId in validationResult.aggregatedData) {
    const agentUsage = validationResult.aggregatedData[agentId];
    if (!agentUsage || agentUsage.length === 0) continue;
    
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
        console.warn(`Agent with ID ${agentId} not found, skipping invoice generation.`);
        continue;
    }

    const totalAmount = agentUsage.reduce((sum, usage) => sum + usage.usageAmount, 0);

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14); // 14 days from now

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}-${agentId.slice(-3)}`,
      agentId: agentId,
      agentName: agent.name,
      amount: totalAmount,
      date: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'unpaid',
      items: agentUsage.map(u => ({
        description: `مصرف ${u.usageType} از ${u.billingPeriodStart} تا ${u.billingPeriodEnd}`,
        amount: u.usageAmount
      }))
    };
    newInvoices.push(newInvoice);
  }

  return {
    errors: [],
    newInvoices,
    newProcessedHashes: validationResult.newProcessedHashes,
  };
}

const SendNotificationInputSchema = z.object({
    invoice: z.custom<Invoice>(),
});
type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;

export async function sendInvoiceNotification(input: SendNotificationInput) {
    const { invoice } = input;
    
    const agent = agents.find(a => a.id === invoice.agentId);
    if (!agent) {
        return { success: false, message: 'نماینده پیدا نشد.' };
    }

    const settings = await getTelegramSettings();
    if (!settings.botToken) {
        return { success: false, message: 'توکن ربات تلگرام در تنظیمات یافت نشد.' };
    }
    
    // Use the agent's specific chat ID if available, otherwise fall back to the default
    const targetChatId = agent.contact.telegramChatId || settings.chatId;

    if (!targetChatId) {
        return { success: false, message: 'شناسه چت تلگرام برای این نماینده یا به صورت پیش‌فرض تنظیم نشده است.' };
    }

    const result = await sendTelegramInvoiceNotifications({
        botToken: settings.botToken,
        chatId: targetChatId,
        messageTemplate: settings.messageTemplate,
        name: agent.name,
        amount: invoice.amount,
        portalLink: `${process.env.NEXT_PUBLIC_BASE_URL || ''}${agent.portalLink}`,
    });

    return result;
}

