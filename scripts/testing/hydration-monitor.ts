import type { ConsoleCollector } from './console-classifier';
import type { ConsoleLogEntry } from './types';

export interface HydrationIssue {
  message: string;
  timestamp: string;
  page?: string;
}

const HYDRATION_PATTERN = /hydration/i;

export const extractHydrationIssues = (logs: ConsoleCollector['getEntries']): HydrationIssue[] => {
  const entries = logs();
  return entries
    .filter((entry: ConsoleLogEntry) => HYDRATION_PATTERN.test(entry.text))
    .map((entry) => ({ message: entry.text, timestamp: entry.timestamp, page: entry.page }));
};
