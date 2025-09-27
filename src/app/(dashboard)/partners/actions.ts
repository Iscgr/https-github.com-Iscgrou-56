"use server";

import { CommissionService } from "@/lib/commission-service";
import { getSalesPartners } from "@/lib/data";
import { partnerFormSchema, type PartnerFormState } from "./types";

// In a real app, you would fetch reports from your database.
// We will use the service to get the data structure.
type CommissionReportWithDetails = Awaited<ReturnType<typeof CommissionService.calculateCommission>>;

const mockReportsStore: CommissionReportWithDetails[] = [];

export async function calculateCommissionAction(partnerId: string, startDate: string, endDate: string) {
    console.log(`[Action] Received request to calculate commission for partner ${partnerId}`);
    try {
        const partners = await getSalesPartners();
        const partner = partners.find(p => p.id === partnerId);
        if (!partner) {
            throw new Error("Sales partner not found.");
        }

        const report = await CommissionService.calculateCommission(partner, startDate, endDate);
        
        // Store the report in our mock store to be retrieved later
        mockReportsStore.push(report);

        return { success: true, message: "Commission calculated successfully.", data: report };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return { success: false, message: errorMessage };
    }
}

/**
 * Item 3.3: Export Commission Details
 * This action retrieves the detailed data for a commission report and formats it as a CSV string.
 */
export async function exportReportDetailsAsCsvAction(reportId: string): Promise<{ success: boolean; csvContent?: string; message: string }> {
    console.log(`[Action] Request to export details for report ${reportId}`);
    try {
        // Find the report in our mock data store
    const report = mockReportsStore.find(r => r.id === reportId);
        if (!report || !report.calculationDetails) {
            throw new Error("Report not found or has no details.");
        }

        // CSV Header
        let csvContent = "Invoice_ID,Invoice_Amount\n";

        // CSV Rows
        for (const detail of report.calculationDetails) {
            csvContent += `${detail.invoiceId},${detail.amount}\n`;
        }

        return { success: true, csvContent, message: "Export data generated successfully." };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return { success: false, message: errorMessage };
    }
}

export async function addOrUpdatePartner(
  prevState: PartnerFormState,
  formData: FormData
): Promise<PartnerFormState> {
  try {
    const validatedFields = partnerFormSchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      email: formData.get("email"),
      commissionRate: formData.get("commissionRate"),
      active: formData.get("active") === "on",
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "فیلدهای ورودی را بررسی کنید",
      };
    }

  const { id } = validatedFields.data;
    
    // اینجا عملیات ذخیره‌سازی یا به‌روزرسانی در دیتابیس انجام می‌شود
    // (برای نمونه کد پیاده‌سازی نشده است)

    return {
      message: id ? "شریک تجاری با موفقیت به‌روزرسانی شد" : "شریک تجاری جدید با موفقیت اضافه شد",
    };
  } catch (_error: unknown) {
    return {
      message: "خطایی در پردازش اطلاعات رخ داد",
    };
  }
}
