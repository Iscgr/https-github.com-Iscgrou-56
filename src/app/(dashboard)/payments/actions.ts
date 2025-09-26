
'use server';

import { z } from 'zod';
import { agents, invoices, payments } from '@/lib/data';
import type { Agent, Invoice, Payment } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const PaymentFormSchema = z.object({
  agentId: z.string(),
  invoiceId: z.string().min(1, { message: 'انتخاب فاکتور الزامی است.' }),
  amount: z.coerce.number().positive({ message: 'مبلغ باید یک عدد مثبت باشد.' }),
  paymentDate: z.string().min(1, { message: 'تاریخ پرداخت الزامی است.' }),
  referenceNumber: z.string().optional(),
});

export type PaymentFormState = {
  message: string;
  errors?: {
    invoiceId?: string[];
    amount?: string[];
    paymentDate?: string[];
  };
  payment?: Payment;
  updatedAgent?: Agent;
  updatedInvoice?: Invoice;
} | {
  message: string;
  errors?: undefined;
  payment?: Payment;
  updatedAgent?: Agent;
  updatedInvoice?: Invoice;
}

export async function recordPayment(
  prevState: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const validatedFields = PaymentFormSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'خطا در اعتبارسنجی ورودی‌ها.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { agentId, invoiceId, amount, paymentDate, referenceNumber } = validatedFields.data;

  const agent = agents.find(a => a.id === agentId);
  const invoice = invoices.find(i => i.id === invoiceId);

  if (!agent) {
    return { message: 'خطا: نماینده یافت نشد.' };
  }
  if (!invoice) {
    return { message: 'خطا: فاکتور یافت نشد.' };
  }

  // Find total payments for this invoice already
  const paymentsForInvoice = payments.filter(p => p.invoiceId === invoiceId);
  const totalPaidForInvoice = paymentsForInvoice.reduce((sum, p) => sum + p.amount, 0);
  
  if (amount > (invoice.amount - totalPaidForInvoice)) {
    return {
      message: `مبلغ پرداخت نمی‌تواند بیشتر از باقیمانده فاکتور ( ${new Intl.NumberFormat('fa-IR').format(invoice.amount - totalPaidForInvoice)} تومان) باشد.`,
      errors: { amount: [`مبلغ بیش از حد مجاز است.`] }
    };
  }


  try {
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      agentId,
      invoiceId,
      amount,
      date: paymentDate,
      referenceNumber,
    };

    payments.unshift(newPayment);

    // Update agent financials
    agent.totalPayments += amount;
    agent.totalDebt -= amount;
    
    // Update invoice status
    const newTotalPaid = totalPaidForInvoice + amount;
    if (newTotalPaid >= invoice.amount) {
        invoice.status = 'paid';
    } else {
        invoice.status = 'partial';
    }

    revalidatePath('/(dashboard)/agents');
    revalidatePath('/(dashboard)/invoices');
    revalidatePath('/(dashboard)/payments');
    revalidatePath(`/portal/${agent.id}`);
    revalidatePath(`/portal/${agent.publicId}`);

    return { 
        message: `پرداخت برای فاکتور ${invoice.invoiceNumber} با موفقیت ثبت شد.`, 
        payment: newPayment,
        updatedAgent: agent,
        updatedInvoice: invoice
    };

  } catch (error) {
    return {
      message: 'خطا در ثبت پرداخت. لطفا دوباره تلاش کنید.'
    };
  }
}
