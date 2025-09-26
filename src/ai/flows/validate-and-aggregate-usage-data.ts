'use server';
/**
 * @fileOverview Validates and aggregates agent usage data from JSON files.
 *
 * - validateAndAggregateUsageData - A function that validates JSON data, aggregates it per agent,
 *   and prevents duplicate processing using content hashing.
 * - ValidateAndAggregateUsageDataInput - The input type for the validateAndAggregateUsageData function.
 * - ValidateAndAggregateUsageDataOutput - The return type for the validateAndAggregateUsageData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import crypto from 'crypto';

const UsageDataSchema = z.object({
  agentId: z.string().describe('Unique identifier for the agent.'),
  usageType: z.string().describe('Type of usage (e.g., calls, data).'),
  usageAmount: z.number().describe('Amount of usage for the period.'),
  billingPeriodStart: z.string().describe('Start date of the billing period (ISO format).'),
  billingPeriodEnd: z.string().describe('End date of the billing period (ISO format).'),
});

const ValidateAndAggregateUsageDataInputSchema = z.object({
  jsonData: z.string().describe('JSON string containing an array of usage data.'),
  processedHashes: z.array(z.string()).optional().describe('Array of already processed data hashes.'),
});

export type ValidateAndAggregateUsageDataInput = z.infer<typeof ValidateAndAggregateUsageDataInputSchema>;

const ValidateAndAggregateUsageDataOutputSchema = z.object({
  aggregatedData: z.record(z.string(), z.array(UsageDataSchema)).describe('Aggregated usage data per agent.'),
  newProcessedHashes: z.array(z.string()).describe('Updated array of processed data hashes.'),
  validationErrors: z.array(z.string()).describe('Array of validation error messages.'),
});

export type ValidateAndAggregateUsageDataOutput = z.infer<typeof ValidateAndAggregateUsageDataOutputSchema>;

export async function validateAndAggregateUsageData(input: ValidateAndAggregateUsageDataInput): Promise<ValidateAndAggregateUsageDataOutput> {
  return validateAndAggregateUsageDataFlow(input);
}

const validateAndAggregateUsageDataFlow = ai.defineFlow({
    name: 'validateAndAggregateUsageDataFlow',
    inputSchema: ValidateAndAggregateUsageDataInputSchema,
    outputSchema: ValidateAndAggregateUsageDataOutputSchema,
  },
  async input => {
    try {
      const usageDataArray = JSON.parse(input.jsonData);
      if (!Array.isArray(usageDataArray)) {
        return {
          aggregatedData: {},
          newProcessedHashes: input.processedHashes ?? [],
          validationErrors: ["Invalid JSON format: Must be an array."],
        };
      }

      let aggregatedData: Record<string, typeof UsageDataSchema._type[]> = {};
      let newProcessedHashes: string[] = input.processedHashes ?? [];
      const validationErrors: string[] = [];

      for (const data of usageDataArray) {
        try {
          UsageDataSchema.parse(data);

          const dataString = JSON.stringify(data);
          const hash = crypto.createHash('sha256').update(dataString).digest('hex');

          if (newProcessedHashes.includes(hash)) {
            console.log("Skipping duplicate data with hash: ", hash);
            continue; // Skip duplicate data
          }

          newProcessedHashes.push(hash);

          const agentId = data.agentId;
          if (!aggregatedData[agentId]) {
            aggregatedData[agentId] = [];
          }
          aggregatedData[agentId]!.push(data);
        } catch (error: any) {
          validationErrors.push(`Validation error: ${error.message}`);
        }
      }

      return {
        aggregatedData: aggregatedData,
        newProcessedHashes: newProcessedHashes,
        validationErrors: validationErrors,
      };
    } catch (error: any) {
      return {
        aggregatedData: {},
        newProcessedHashes: input.processedHashes ?? [],
        validationErrors: [`Invalid JSON: ${error.message}`],
      };
    }
  }
);
