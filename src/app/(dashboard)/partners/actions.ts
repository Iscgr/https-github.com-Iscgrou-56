'use server';

import { z } from 'zod';
import { salesPartners } from '@/lib/data';
import type { SalesPartner } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const PartnerFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: 'نام حداقل باید ۲ کاراکتر باشد.' }),
  commissionRate: z.coerce
    .number({ invalid_type_error: 'نرخ کمیسیون باید عدد باشد.' })
    .min(0, { message: 'نرخ کمیسیون نمی‌تواند منفی باشد.' })
    .max(100, { message: 'نرخ کمیسیون نمی‌تواند بیشتر از ۱۰۰ باشد.' }),
});

export type PartnerFormState = {
  message: string;
  errors?: {
    name?: string[];
    commissionRate?: string[];
  };
}

export async function addOrUpdatePartner(
  prevState: PartnerFormState,
  formData: FormData
): Promise<PartnerFormState> {
  const rawData = {
    id: formData.get('id') || undefined,
    name: formData.get('name'),
    commissionRate: formData.get('commissionRate'),
  };
  
  const validatedFields = PartnerFormSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: 'خطا در اعتبارسنجی ورودی‌ها.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { id, name, commissionRate } = validatedFields.data;

  try {
    if (id) {
      // Update existing partner
      const partnerIndex = salesPartners.findIndex(p => p.id === id);
      if (partnerIndex > -1) {
        salesPartners[partnerIndex] = { ...salesPartners[partnerIndex], name, commissionRate };
        revalidatePath('/(dashboard)/partners');
        return { message: `همکار فروش ${name} با موفقیت ویرایش شد.` };
      } else {
        return { message: 'خطا: همکار فروش یافت نشد.' };
      }
    } else {
      // Add new partner
      const newPartner: SalesPartner = {
        id: `partner-${Date.now()}`,
        name,
        commissionRate,
        totalSubAgentSales: 0, 
      };
      salesPartners.unshift(newPartner);
      revalidatePath('/(dashboard)/partners');
      return { message: `همکار فروش ${name} با موفقیت اضافه شد.` };
    }
  } catch (error) {
    return {
      message: 'خطا در عملیات. لطفا دوباره تلاش کنید.'
    };
  }
}
