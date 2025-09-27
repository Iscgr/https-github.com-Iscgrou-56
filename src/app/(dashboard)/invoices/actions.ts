"use server";

import { z } from "zod";
import { createHash, randomUUID } from "crypto";

import { InvoiceSource, InvoiceStatus } from "@/generated/prisma";
import { DataImporterService, ImporterConfig } from "@/lib/importer";
import { createIdempotentInvoice } from "@/lib/data";

// Define the shape of a single row in the uploaded file
const InvoiceUploadSchema = z.object({
  agentId: z.string().min(1, "Agent ID is required"),
  agentName: z.string().min(1, "Agent name is required"),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  date: z.string().datetime("Date must be a valid ISO datetime string"),
  dueDate: z.string().datetime("Due date must be a valid ISO datetime string"),
  invoiceNumber: z.string().min(1).optional(),
  description: z.string().optional().default("N/A"),
});

type InvoiceUploadData = z.infer<typeof InvoiceUploadSchema>;

// Configuration for the invoice importer
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const invoiceImporterConfig: ImporterConfig<InvoiceUploadData> = {
  parseRow: (row: unknown) => {
    const source = isRecord(row) ? row : {};
    return {
      agentId: String(source.agentId ?? '').trim(),
      agentName: String(source.agentName ?? '').trim(),
      amount: Number(source.amount ?? 0),
      date: String(source.date ?? '').trim(),
      dueDate: String(source.dueDate ?? '').trim(),
      invoiceNumber: source.invoiceNumber ? String(source.invoiceNumber).trim() : undefined,
      description: source.description ? String(source.description).trim() : 'N/A',
    };
  },

  validateRow: (data: InvoiceUploadData) => {
    const result = InvoiceUploadSchema.safeParse(data);
    return {
      isValid: result.success,
      errors: result.success
        ? []
        : Object.values(result.error.flatten().fieldErrors)
            .flat()
            .filter((message): message is string => Boolean(message)),
    };
  },

  processRow: async (data: InvoiceUploadData, batchJobId: string) => {
    const deterministicKey = `${data.agentId}|${data.amount}|${data.date}|${data.dueDate}|${data.description ?? ''}`;
    const invoiceNumber =
      data.invoiceNumber ?? `BATCH-${createHash('sha256').update(deterministicKey).digest('hex').slice(0, 12).toUpperCase()}`;

    await createIdempotentInvoice({
      invoiceNumber,
      agentId: data.agentId,
      amount: data.amount,
      issueDate: data.date,
      dueDate: data.dueDate,
      status: InvoiceStatus.UNPAID,
      source: InvoiceSource.BATCH_UPLOAD,
      metadata: {
        batchJobId,
        agentName: data.agentName,
        description: data.description,
        importerVersion: 'v1',
      },
    });

    return { success: true, message: `Invoice ${invoiceNumber} processed.` };
  },
};


export async function uploadInvoicesAction(fileContent: Array<unknown>) {
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

  } catch (error: unknown) {
    console.error(`[Action] Critical error during invoice upload for Batch Job ID: ${batchJobId}`, error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return {
        success: false,
        message: `A critical error occurred: ${errorMessage}`,
    };
  }
}
