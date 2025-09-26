'use server';

import { z } from 'zod';
import { agents } from '@/lib/data';
import type { Agent } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

const AgentFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: 'نام حداقل باید ۲ کاراکتر باشد.' }),
  code: z.string().min(2, { message: 'کد نماینده حداقل باید ۲ کاراکتر باشد.'}),
  email: z.string().email({ message: 'ایمیل وارد شده معتبر نیست.' }),
  phone: z.string().min(11, { message: 'شماره تلفن حداقل باید ۱۱ رقم باشد.' }),
  telegramChatId: z.string().optional(),
  salesPartnerId: z.string().nullable(),
  commissionRate: z.coerce.number()
    .min(0, { message: "پورسانت نمی‌تواند منفی باشد." })
    .max(100, { message: "پورسانت نمی‌تواند بیشتر از ۱۰۰ باشد." }),
});

export type AgentFormState = {
  message: string;
  errors?: {
    name?: string[];
    code?: string[];
    email?: string[];
    phone?: string[];
    salesPartnerId?: string[];
    commissionRate?: string[];
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
  const rawData = Object.fromEntries(formData.entries());
  
  const processedData = {
    ...rawData,
    salesPartnerId: rawData.salesPartnerId === 'none' ? null : rawData.salesPartnerId,
  };

  const validatedFields = AgentFormSchema.safeParse(processedData);

  if (!validatedFields.success) {
    return {
      message: 'خطا در اعتبارسنجی ورودی‌ها.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { id, name, code, email, phone, telegramChatId, salesPartnerId, commissionRate } = validatedFields.data;

  try {
    if (id) {
      // Update existing agent
      const agentIndex = agents.findIndex(a => a.id === id);
      if (agentIndex === -1) {
        return { message: 'خطا: نماینده برای ویرایش یافت نشد.' };
      }

      const updatedAgent = {
        ...agents[agentIndex],
        name,
        code,
        contact: { email, phone, telegramChatId: telegramChatId || undefined },
        salesPartnerId,
        commissionRate,
      };

      agents[agentIndex] = updatedAgent;
      
      revalidatePath('/(dashboard)/agents');
      return { message: `نماینده ${name} با موفقیت ویرایش شد.`, agent: updatedAgent };

    } else {
      // Add new agent
      const agentId = `agent-${Date.now()}`;
      const publicId = `pub-${code}-${crypto.randomBytes(4).toString('hex')}`;
      
      const newAgent: Agent = {
        id: agentId,
        publicId: publicId,
        name,
        code,
        contact: {
          email,
          phone,
          telegramChatId: telegramChatId || undefined,
        },
        salesPartnerId,
        commissionRate,
        status: 'active',
        totalSales: 0,
        totalPayments: 0,
        totalDebt: 0,
        avatarUrl: `https://picsum.photos/seed/${name}/100/100`,
        portalLink: `/portal/${publicId}`,
        createdAt: new Date().toISOString(),
      };

      agents.unshift(newAgent);
      
      revalidatePath('/(dashboard)/agents');
      return { message: `نماینده ${name} با موفقیت اضافه شد.`, agent: newAgent };
    }
  } catch (error) {
    return {
      message: 'خطا در پردازش درخواست. لطفا دوباره تلاش کنید.'
    };
  }
}
