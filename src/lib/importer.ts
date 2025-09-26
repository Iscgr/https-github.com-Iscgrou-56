/**
 * @file src/lib/importer.ts
 * @description Module 1, Items 1.4, 1.5, 1.6: Data Importer Service
 * This service provides a generic, configurable, and resilient way to process file uploads.
 * It incorporates retry policies for transient errors and a dead-letter queue for poison pill messages.
 */

import { createIdempotentInvoice } from './data';
import { Invoice } from './types';

// --- Configuration for the Importer ---

export interface ImporterConfig<T> {
  // Parses a raw row (e.g., from a CSV) into a structured type T
  parseRow: (row: any) => T;
  // Validates the structured data
  validateRow: (data: T) => { isValid: boolean; errors: string[] };
  // Processes a single, validated data object
  processRow: (data: T, batchJobId: string) => Promise<{ success: boolean; message: string }>;
}

// --- Dead Letter Queue (DLQ) Simulation ---

interface DeadLetter<T> {
  timestamp: string;
  batchJobId: string;
  rowData: T;
  reason: string;
}

// In a real system, this would be a persistent queue like SQS DLQ, Redis, or a DB table.
const deadLetterQueue: DeadLetter<any>[] = [];

const addToDLQ = <T>(batchJobId: string, rowData: T, reason: string) => {
  const deadLetter: DeadLetter<T> = {
    timestamp: new Date().toISOString(),
    batchJobId,
    rowData,
    reason,
  };
  deadLetterQueue.push(deadLetter);
  console.error(`[DLQ] Added to Dead Letter Queue. Job: ${batchJobId}, Reason: ${reason}`, rowData);
};

// --- Resilient Row Processor (Item 1.4 & 1.5) ---

const processRowResiliently = async <T>(
  config: ImporterConfig<T>,
  rowData: T,
  batchJobId: string,
  maxRetries = 3,
  initialDelay = 1000 // 1 second
) => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      attempts++;
      console.log(`[Importer] Attempt ${attempts} for row...`, rowData);
      const result = await config.processRow(rowData, batchJobId);
      
      // If processRow itself returns a failure (e.g. business logic validation), don't retry.
      if (!result.success) {
          throw new Error(`Non-retriable error: ${result.message}`);
      }
      
      return { success: true, message: 'Row processed successfully.' };
    } catch (error: any) {
      // This catch block is for *transient* or unexpected errors (e.g., network, DB connection)
      console.warn(`[Importer] Attempt ${attempts} failed: ${error.message}`);
      if (attempts >= maxRetries) {
        addToDLQ(batchJobId, rowData, `Failed after ${maxRetries} attempts: ${error.message}`);
        return { success: false, message: `Row failed permanently and was moved to DLQ.` };
      }
      // Exponential backoff
      const delay = initialDelay * Math.pow(2, attempts - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  // This part should theoretically not be reached
  return { success: false, message: 'Exited process loop unexpectedly.' };
};


// --- Public Service API ---

export const DataImporterService = {
  processFile: async <T>(fileContent: any[], config: ImporterConfig<T>, batchJobId: string) => {
    console.log(`[Importer] Starting to process file for batch job '${batchJobId}' with ${fileContent.length} rows.`);
    
    const results = {
        totalRows: fileContent.length,
        successful: 0,
        failed: 0,
        skipped: 0,
    };

    for (const rawRow of fileContent) {
      const parsedRow = config.parseRow(rawRow);
      const validation = config.validateRow(parsedRow);

      if (!validation.isValid) {
        addToDLQ(batchJobId, parsedRow, `Validation failed: ${validation.errors.join(', ')}`);
        results.failed++;
        continue;
      }

      const result = await processRowResiliently(config, parsedRow, batchJobId);
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
      }
    }
    
    console.log(`[Importer] Finished processing for batch job '${batchJobId}'.`, results);
    return results;
  }
};
