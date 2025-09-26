'use server';

import { z } from 'zod';
import { getAgents, getInvoices, getPayments } from '@/lib/data';
import type { Payment } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { InvoiceService } from '@/lib/invoice-service';
import { WalletService } from '@/lib/wallet-service';

export type PaymentFormState = {
  message: string;
  errors?: {
    agentId?: string[];
    invoiceId?: string[];
    amount?: string[];
    date?: string[];
  };
};

const PaymentSchema = z.object({
  agentId: z.string({ invalid_type_error: 'لطفا یک نماینده انتخاب کنید' }),
  invoiceId: z.string().optional(),
  amount: z.coerce.number().positive({ message: 'مبلغ باید بیشتر از صفر باشد' }),
  date: z.string(),
  paymentMethod: z.enum(['EXTERNAL', 'INTERNAL_SETTLEMENT'])
});

export async function recordPayment(
  state: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const validatedFields = PaymentSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'لطفا خطاهای فرم را برطرف کنید.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { agentId, amount, date, paymentMethod, invoiceId } = validatedFields.data;

  try {
    if (paymentMethod === 'EXTERNAL') {
        // This is a new deposit
        await WalletService.deposit(agentId, amount, `payment_ref_${Date.now()}`);
        console.log(`[Action] Recorded external deposit of ${amount} for agent ${agentId}.`);
    }

    // Trigger settlement for the agent regardless of payment method
    await WalletService.settleInvoices(agentId);
    console.log(`[Action] Triggered invoice settlement for agent ${agentId}.`);

    // Revalidate paths to update UI
    revalidatePath('/payments');
    revalidatePath('/agents');
    if (invoiceId) {
        revalidatePath(`/invoices/${invoiceId}`);
    }

    return { message: 'پرداخت با موفقیت ثبت و تسویه شد.' };

  } catch (error: any) {
      return { message: `خطا در ثبت پرداخت: ${error.message}` };
  }
}
