'use server';

import { z } from 'zod';
import { agents, invoices, payments } from '@/lib/data';
import type { Payment } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const PaymentFormSchema = z.object({
  agentId: z.string().min(1, { message: 'انتخاب نماینده الزامی است.' }),
  invoiceId: z.string().min(1, { message: 'انتخاب فاکتور الزامی است.' }),
  amount: z.coerce.number().positive({ message: 'مبلغ باید یک عدد مثبت باشد.' }),
  paymentDate: z.string().min(1, { message: 'تاریخ پرداخت الزامی است.' }),
  referenceNumber: z.string().optional(),
});

export type PaymentFormState = {
  message: string;
  errors?: {
    agentId?: string[];
    invoiceId?: string[];
    amount?: string[];
    paymentDate?: string[];
  };
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
  if(invoice.agentId !== agentId) {
    return { message: 'خطا: این فاکتور متعلق به نماینده انتخاب شده نیست.'}
  }

  const paymentsForInvoice = payments.filter(p => p.invoiceId === invoiceId);
  const totalPaidForInvoice = paymentsForInvoice.reduce((sum, p) => sum + p.amount, 0);
  
  const remainingAmount = invoice.amount - totalPaidForInvoice;

  if (amount > remainingAmount) {
    return {
      message: `مبلغ پرداخت ( ${new Intl.NumberFormat('fa-IR').format(amount)} ) نمی‌تواند بیشتر از باقیمانده فاکتور ( ${new Intl.NumberFormat('fa-IR').format(remainingAmount)} تومان) باشد.`,
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

    agent.totalPayments += amount;
    agent.totalDebt -= amount;
    
    const newTotalPaid = totalPaidForInvoice + amount;
    invoice.status = newTotalPaid >= invoice.amount ? 'paid' : 'partial';

    revalidatePath('/(dashboard)/agents');
    revalidatePath(`/(dashboard)/agents/${agent.id}`);
    revalidatePath('/(dashboard)/invoices');
    revalidatePath('/(dashboard)/payments');

    return { 
        message: `پرداخت برای فاکتور ${invoice.invoiceNumber} با موفقیت ثبت شد.`, 
    };

  } catch (error) {
    return {
      message: 'خطا در ثبت پرداخت. لطفا دوباره تلاش کنید.'
    };
  }
}
