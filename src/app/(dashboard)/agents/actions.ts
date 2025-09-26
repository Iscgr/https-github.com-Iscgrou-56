
'use server';

import { z } from 'zod';
import { agents, salesPartners } from '@/lib/data';
import type { Agent } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const AgentFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'نام حداقل باید ۳ کاراکتر باشد.' }),
  email: z.string().email({ message: 'ایمیل وارد شده معتبر نیست.' }),
  phone: z.string().min(10, { message: 'شماره تلفن حداقل باید ۱۰ رقم باشد.' }),
  telegramChatId: z.string().optional(),
  salesPartnerId: z.string().nullable(),
});

export type AgentFormState = {
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    phone?: string[];
    salesPartnerId?: string[];
  };
  agent?: Agent;
} | {
  message: string;
  agent?: Agent;
  errors?: undefined;
}

export async function addOrUpdateAgent(
  prevState: AgentFormState,
  formData: FormData
): Promise<AgentFormState> {
  const validatedFields = AgentFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    telegramChatId: formData.get('telegramChatId'),
    salesPartnerId: formData.get('salesPartnerId') || null,
  });

  if (!validatedFields.success) {
    return {
      message: 'خطا در اعتبارسنجی ورودی‌ها.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, phone, telegramChatId, salesPartnerId } = validatedFields.data;

  try {
    // In a real app, you'd save this to a database.
    // For now, we'll just add it to our in-memory data array.
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name,
      contact: {
        email,
        phone,
        telegramChatId: telegramChatId || undefined,
      },
      salesPartnerId,
      status: 'active',
      totalSales: 0,
      totalPayments: 0,
      avatarUrl: `https://picsum.photos/seed/${name}/100/100`,
      portalLink: `/portal/agent-${Date.now()}`,
    };

    // This is a temporary solution for this environment to simulate data persistence.
    // In a real database, this would be an INSERT or UPDATE query.
    agents.unshift(newAgent);
    
    // Revalidate the agents path to show the new agent in the list.
    revalidatePath('/(dashboard)/agents');
    
    return { message: `نماینده ${name} با موفقیت اضافه شد.`, agent: newAgent };

  } catch (error) {
    return {
      message: 'خطا در افزودن نماینده. لطفا دوباره تلاش کنید.'
    };
  }
}
