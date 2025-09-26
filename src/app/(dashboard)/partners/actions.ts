'use server';

import { z } from 'zod';
import { salesPartners } from '@/lib/data';
import type { SalesPartner } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const PartnerFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'نام حداقل باید ۳ کاراکتر باشد.' }),
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
  partner?: SalesPartner;
} | {
  message: string;
  partner?: SalesPartner;
  errors?: undefined;
}

export async function addOrUpdatePartner(
  prevState: PartnerFormState,
  formData: FormData
): Promise<PartnerFormState> {
  const validatedFields = PartnerFormSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    commissionRate: formData.get('commissionRate'),
  });

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
        const updatedPartner = { ...salesPartners[partnerIndex], name, commissionRate };
        salesPartners[partnerIndex] = updatedPartner;
        revalidatePath('/(dashboard)/partners');
        return { message: `همکار فروش ${name} با موفقیت ویرایش شد.`, partner: updatedPartner };
      } else {
        return { message: 'همکار فروش یافت نشد.' };
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
      return { message: `همکار فروش ${name} با موفقیت اضافه شد.`, partner: newPartner };
    }
  } catch (error) {
    return {
      message: 'خطا در عملیات. لطفا دوباره تلاش کنید.'
    };
  }
}
