import { config } from 'dotenv';
config();

import '@/ai/flows/validate-and-aggregate-usage-data.ts';
import '@/ai/flows/telegram-invoice-notifications.ts';