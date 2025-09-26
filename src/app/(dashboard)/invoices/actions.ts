
'use server';

import { validateAndAggregateUsageData } from '@/ai/flows/validate-and-aggregate-usage-data';
import { sendTelegramInvoiceNotifications } from '@/ai/flows/telegram-invoice-notifications';
import { agents, invoices } from '@/lib/data';
import type { Invoice } from '@/lib/types';
import { z } from 'zod';
import { getTelegramSettings } from '@/lib/settings';
import { revalidatePath } from 'next/cache';

const ProcessUsageFileInputSchema = z.object({
  jsonData: z.string(),
  processedHashes: z.array(z.string()).optional(),
});
type ProcessUsageFileInput = z.infer<typeof ProcessUsageFileInputSchema>;

async function generateInvoiceNumber(issueDate: Date): Promise<string> {
  const year = issueDate.getFullYear();
  const sequence = invoices.filter(inv => new Date(inv.date).getFullYear() === year).length + 1;
  return `MF-${year}-${sequence.toString().padStart(4, '0')}`;
}

export async function processUsageFile(input: ProcessUsageFileInput) {
  const validationResult = await validateAndAggregateUsageData({
    jsonData: input.jsonData,
    processedHashes: input.processedHashes,
  });

  if (validationResult.validationErrors && validationResult.validationErrors.length > 0) {
    return { errors: validationResult.validationErrors, newInvoices: [] };
  }

  const newInvoices: Invoice[] = [];
  const today = new Date();
  
  for (const agentId in validationResult.aggregatedData) {
    const agentUsage = validationResult.aggregatedData[agentId];
    if (!agentUsage || agentUsage.length === 0) continue;
    
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
        console.warn(`Agent with ID ${agentId} not found, skipping invoice generation.`);
        continue;
    }

    const totalAmount = agentUsage.reduce((sum, usage) => sum + usage.usageAmount, 0);

    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14);

    const invoiceNumber = await generateInvoiceNumber(today);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}-${agentId.slice(-3)}`,
      invoiceNumber,
      agentId,
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
    
    invoices.unshift(newInvoice);
    newInvoices.push(newInvoice);

    agent.totalSales += totalAmount;
    agent.totalDebt += totalAmount;
  }

  if (newInvoices.length > 0) {
     revalidatePath('/(dashboard)/invoices');
     revalidatePath('/(dashboard)/agents');
  }

  return {
    errors: [],
    newInvoices,
    newProcessedHashes: validationResult.newProcessedHashes,
  };
}


export async function sendInvoiceNotificationAction(invoiceId: string) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        return { success: false, message: 'فاکتور پیدا نشد.' };
    }
    
    const agent = agents.find(a => a.id === invoice.agentId);
    if (!agent) {
        return { success: false, message: 'نماینده پیدا نشد.' };
    }

    const settings = await getTelegramSettings();
    if (!settings.botToken) {
        return { success: false, message: 'توکن ربات تلگرام در تنظیمات یافت نشد.' };
    }
    
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
