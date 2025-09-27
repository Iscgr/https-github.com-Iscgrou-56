'use server';
/**
 * @fileOverview Validates and aggregates agent usage data from JSON files.
 *
 * - validateAndAggregateUsageData - A function that validates JSON data, aggregates it per agent,
 *   and prevents duplicate processing using content hashing.
 * - ValidateAndAggregateUsageDataInput - The input type for the validateAndAggregateUsageData function.
 * - ValidateAndAggregateUsageDataOutput - The return type for the validateAndAggregateUsageData function.
 */

import { ai } from '@/ai/genkit';
import { getRepositories } from '@/lib/persistence/unit-of-work';
import { z } from 'genkit';
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

type UsageData = z.infer<typeof UsageDataSchema>;

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
      const usageDataArray = JSON.parse(input.jsonData) as unknown;
      if (!Array.isArray(usageDataArray)) {
        return {
          aggregatedData: {},
          newProcessedHashes: input.processedHashes ?? [],
          validationErrors: ["Invalid JSON format: Must be an array."],
        };
      }

      const validationErrors: string[] = [];

      const validatedRows: Array<{ data: UsageData; hash: string }> = [];
      for (const candidate of usageDataArray) {
        try {
          const parsed = UsageDataSchema.parse(candidate);
          const dataString = JSON.stringify(parsed);
          const hash = crypto.createHash('sha256').update(dataString).digest('hex');
          validatedRows.push({ data: parsed, hash });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
          validationErrors.push(`Validation error: ${errorMessage}`);
        }
      }

      const repositories = getRepositories();
      const initialHashes = new Set(input.processedHashes ?? []);
      const uniqueHashes = Array.from(new Set(validatedRows.map((row) => row.hash)));
      const hashesInDb = await repositories.usage.findExisting(uniqueHashes);

  const aggregatedData: Record<string, UsageData[]> = {};
      const newHashesToPersist: string[] = [];

      for (const { data, hash } of validatedRows) {
        if (initialHashes.has(hash) || hashesInDb.has(hash)) {
          initialHashes.add(hash);
          continue;
        }

        initialHashes.add(hash);
        newHashesToPersist.push(hash);

        const agentId = data.agentId;
        if (!aggregatedData[agentId]) {
          aggregatedData[agentId] = [];
        }
        aggregatedData[agentId]!.push(data);
      }

      if (newHashesToPersist.length) {
        await repositories.usage.markProcessedMany(newHashesToPersist);
      }

      return {
        aggregatedData,
        newProcessedHashes: Array.from(initialHashes),
        validationErrors,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      return {
        aggregatedData: {},
        newProcessedHashes: input.processedHashes ?? [],
        validationErrors: [`Invalid JSON: ${errorMessage}`],
      };
    }
  }
);
