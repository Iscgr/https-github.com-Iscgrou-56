'use server';

/**
 * @fileOverview This file defines a Genkit flow for sending batched invoice notifications to agents via Telegram.
 *
 * It includes:
 * - `sendTelegramInvoiceNotifications`: A function to send invoice notifications.
 * - `TelegramInvoiceNotificationsInput`: The input type for the function, including bot token, chat ID, and message template.
 * - `TelegramInvoiceNotificationsOutput`: The output type for the function, indicating success or failure.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TelegramInvoiceNotificationsInputSchema = z.object({
  botToken: z.string().describe('The Telegram bot token.'),
  chatId: z.string().describe('The Telegram chat ID to send the notification to.'),
  messageTemplate: z.string().describe('The message template for the notification, which can include variables like name, amount, and portal link.'),
  name: z.string().describe('The name of the agent.'),
  amount: z.number().describe('The invoice amount.'),
  portalLink: z.string().describe('The link to the agent portal.'),
});
export type TelegramInvoiceNotificationsInput = z.infer<typeof TelegramInvoiceNotificationsInputSchema>;

const TelegramInvoiceNotificationsOutputSchema = z.object({
  success: z.boolean().describe('Whether the notification was sent successfully.'),
  message: z.string().describe('A message indicating the result of the operation.'),
});
export type TelegramInvoiceNotificationsOutput = z.infer<typeof TelegramInvoiceNotificationsOutputSchema>;

export async function sendTelegramInvoiceNotifications(input: TelegramInvoiceNotificationsInput): Promise<TelegramInvoiceNotificationsOutput> {
  return telegramInvoiceNotificationsFlow(input);
}

const telegramInvoiceNotificationsPrompt = ai.definePrompt({
  name: 'telegramInvoiceNotificationsPrompt',
  input: {schema: TelegramInvoiceNotificationsInputSchema},
  prompt: `Send a Telegram notification to agent {{name}} for invoice amount {{amount}} using this portal link: {{portalLink}}. Use the following bot token: {{botToken}} and chat ID: {{chatId}}. The message should be formatted using this template: {{messageTemplate}}.`,
});

const telegramInvoiceNotificationsFlow = ai.defineFlow(
  {
    name: 'telegramInvoiceNotificationsFlow',
    inputSchema: TelegramInvoiceNotificationsInputSchema,
    outputSchema: TelegramInvoiceNotificationsOutputSchema,
  },
  async input => {
    try {
      // Construct the Telegram API URL
      const apiUrl = `https://api.telegram.org/bot${input.botToken}/sendMessage`;

      // Construct the message using the template and input variables
      const messageText = input.messageTemplate
        .replace(/\{\{name\}\}/g, input.name)
        .replace(/\{\{amount\}\}/g, input.amount.toString())
        .replace(/\{\{portalLink\}\}/g, input.portalLink);

      // Construct the request body
      const requestBody = JSON.stringify({
        chat_id: input.chatId,
        text: messageText,
      });

      // Send the message to Telegram
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Telegram API error:', response.status, errorText);
        return {
          success: false,
          message: `Failed to send Telegram notification: ${response.status} ${errorText}`,
        };
      }

      const responseData = await response.json();

      if (responseData.ok) {
        return {
          success: true,
          message: 'Telegram notification sent successfully.',
        };
      } else {
        console.error('Telegram API error:', responseData);
        return {
          success: false,
          message: `Failed to send Telegram notification: ${JSON.stringify(responseData)}`,
        };
      }
    } catch (error: any) {
      console.error('Error sending Telegram notification:', error);
      return {
        success: false,
        message: `Error sending Telegram notification: ${error.message}`,
      };
    }
  }
);
