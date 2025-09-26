"use server";

import { CommissionService } from "@/lib/commission-service";
import { getSalesPartners } from "@/lib/data";

// In a real app, you would fetch reports from your database.
// We will use the service to get the data structure.
let mockReportsStore: any[] = [];

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
    } catch (error: any) {
        return { success: false, message: error.message };
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

    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
