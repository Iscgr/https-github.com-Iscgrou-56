import { z } from "zod";

export const partnerFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "نام شریک تجاری الزامی است" }),
  email: z.string().email({ message: "لطفا یک ایمیل معتبر وارد کنید" }),
  commissionRate: z.coerce.number().min(0).max(100),
  active: z.boolean().default(true),
});

export type PartnerFormValues = z.infer<typeof partnerFormSchema>;

export type PartnerFormState = {
  errors?: {
    [K in keyof PartnerFormValues]?: string[];
  };
  message?: string | null;
};