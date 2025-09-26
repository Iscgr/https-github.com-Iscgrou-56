'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { Actor } from '@/lib/types';
import { withAuditContext } from '@/lib/audit-context';
import { PaymentService } from '@/lib/payment-service'; // MODIFIED: Import the new pure service

const getAuthenticatedUser = async (): Promise<Actor> => {
  return Promise.resolve({
    userId: 'admin_user_001',
    role: 'admin',
  });
};

export type PaymentFormState = {
  message: string;
  errors?: {
    agentId?: string[];
    amount?: string[];
    date?: string[];
  };
};

const PaymentSchema = z.object({
  agentId: z.string({ invalid_type_error: 'لطفا یک نماینده انتخاب کنید' }),
  amount: z.coerce.number().positive({ message: 'مبلغ باید بیشتر از صفر باشد' }),
  date: z.string(),
  paymentMethod: z.enum(['EXTERNAL', 'INTERNAL_SETTLEMENT'])
});

/**
 * The server action is now a thin wrapper.
 * Its responsibilities are:
 * 1. Validate the form data.
 * 2. Set up the audit context.
 * 3. Call the pure business logic service.
 * 4. Handle UI-specific side effects (revalidation).
 */
export const recordPayment = async (
  state: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> => {
  const validatedFields = PaymentSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'لطفا خطاهای فرم را برطرف کنید.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { agentId, amount } = validatedFields.data;
  const actor = await getAuthenticatedUser();
  
  // Create a function that calls the pure service.
  const paymentProcessor = async () => {
      return PaymentService.processPaymentTransaction(agentId, amount);
  };
  
  // Wrap the processor with the audit context.
  const auditedProcessor = withAuditContext(actor, paymentProcessor);

  try {
    const result = await auditedProcessor();

    if (!result.success) {
        throw new Error(result.message);
    }
    
    // UI-specific side effect. This is now safely outside the core logic.
    revalidatePath('/payments');
    revalidatePath('/agents');

    return { message: 'پرداخت با موفقیت ثبت و تسویه شد.' };

  } catch (error: any) {
      return { message: `خطا در ثبت پرداخت: ${error.message}` };
  }
};
