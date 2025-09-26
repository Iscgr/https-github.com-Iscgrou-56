
'use server';

import { validateAndAggregateUsageData } from '@/ai/flows/validate-and-aggregate-usage-data';
import { agents } from '@/lib/data';
import type { Invoice } from '@/lib/types';
import { z } from 'zod';

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
