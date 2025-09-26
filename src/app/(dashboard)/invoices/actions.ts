"use server";

import { z } from "zod";
import { DataImporterService, ImporterConfig } from "@/lib/importer";
import { createIdempotentInvoice } from "@/lib/data";
import { Invoice } from "@/lib/types";
import { randomUUID } from "crypto";

// Define the shape of a single row in the uploaded file
const InvoiceUploadSchema = z.object({
  agentId: z.string().min(1, "Agent ID is required"),
  agentName: z.string().min(1, "Agent name is required"),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  date: z.string().datetime("Date must be a valid ISO datetime string"),
  dueDate: z.string().datetime("Due date must be a valid ISO datetime string"),
  description: z.string().optional().default("N/A"),
});

type InvoiceUploadData = z.infer<typeof InvoiceUploadSchema>;

// Configuration for the invoice importer
const invoiceImporterConfig: ImporterConfig<InvoiceUploadData> = {
  parseRow: (row: any) => ({
    // In a real scenario, this would map CSV columns to object keys
    agentId: row.agentId,
    agentName: row.agentName,
    amount: row.amount,
    date: row.date,
    dueDate: row.dueDate,
    description: row.description,
  }),
  
  validateRow: (data: InvoiceUploadData) => {
    const result = InvoiceUploadSchema.safeParse(data);
    return {
      isValid: result.success,
      errors: result.success ? [] : result.error.flatten().fieldErrors.toString(),
    };
  },
  
  processRow: async (data: InvoiceUploadData, batchJobId: string) => {
    // This is where we connect to our data layer
    // 1.2: Idempotency is handled here
    const idempotencyKey = `${batchJobId}-${JSON.stringify(data)}`; // Simple hash for demo
    
    const invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'> = {
        agentId: data.agentId,
        agentName: data.agentName,
        date: data.date,
        dueDate: data.dueDate,
        amount: data.amount,
        status: 'unpaid',
        items: [{ description: data.description, amount: data.amount }],
        // 1.1: Audit Trail is handled here
        source: 'BATCH_UPLOAD',
        batchJobId: batchJobId,
    };

    return createIdempotentInvoice(idempotencyKey, invoiceData);
  }
};


export async function uploadInvoicesAction(fileContent: any[]) {
  const batchJobId = `job_${randomUUID()}`;
  
  console.log(`[Action] Starting invoice upload action with Batch Job ID: ${batchJobId}`);

  try {
    // Use the resilient importer service to process the file
    const result = await DataImporterService.processFile(fileContent, invoiceImporterConfig, batchJobId);
    console.log(`[Action] Invoice upload finished for Batch Job ID: ${batchJobId}`, result);
    
    return {
      success: true,
      message: `File processing complete. Successful: ${result.successful}, Failed: ${result.failed}.`,
      data: result,
    };

  } catch (error: any) {
    console.error(`[Action] Critical error during invoice upload for Batch Job ID: ${batchJobId}`, error);
    return {
        success: false,
        message: `A critical error occurred: ${error.message}`,
    };
  }
}
