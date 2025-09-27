import type { ConsoleLogEntry, ConsoleSeverity } from './types';

const IGNORED_PATTERNS: RegExp[] = [
  /Download the React DevTools/i,
  /DevTools failed to load source map/i,
];

const WARNING_PATTERNS: RegExp[] = [
  /has been renamed/i,
  /deprecated/i,
  /DialogContent requires a `DialogTitle`/i,
  /ARIA attributes/i,
];

const CRITICAL_PATTERNS: RegExp[] = [
  /Hydration failed/i,
  /Uncaught/i,
  /TypeError/i,
  /ReferenceError/i,
  /Unhandled Rejection/i,
  /Failed to load resource/i,
];

const MAX_MESSAGE_LENGTH = 5_000;

export const classifyConsoleMessage = (type: string, text: string): ConsoleSeverity => {
  const normalizedType = type?.toLowerCase?.() ?? 'log';
  const trimmed = text.slice(0, MAX_MESSAGE_LENGTH);

  if (IGNORED_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return 'INFO';
  }

  if (CRITICAL_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return 'CRITICAL';
  }

  if (normalizedType === 'error' || normalizedType === 'assert') {
    return 'CRITICAL';
  }

  if (WARNING_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return 'WARNING';
  }

  if (normalizedType === 'warning') {
    return 'WARNING';
  }

  return 'INFO';
};

export interface ConsoleCollector {
  handle: (msg: any) => void;
  getEntries: () => ConsoleLogEntry[];
  hasCritical: () => boolean;
  clear: () => void;
  detach: () => void;
}

export const createConsoleCollector = (page: any, pageName?: string): ConsoleCollector => {
  const entries: ConsoleLogEntry[] = [];

  const handler = (msg: any) => {
    try {
      const type = typeof msg.type === 'function' ? msg.type() : msg.type ?? 'log';
      const text = typeof msg.text === 'function' ? msg.text() : msg.text ?? '';
      const severity = classifyConsoleMessage(type, text);
      let location: string | undefined;

      try {
        const loc = typeof msg.location === 'function' ? msg.location() : undefined;
        if (loc && typeof loc === 'object' && 'url' in loc) {
          const { url, lineNumber, columnNumber } = loc as {
            url?: string;
            lineNumber?: number;
            columnNumber?: number;
          };
          const line = typeof lineNumber === 'number' ? lineNumber : undefined;
          const column = typeof columnNumber === 'number' ? columnNumber : undefined;
          const parts = [url, line != null ? `:${line}` : '', column != null ? `:${column}` : ''].filter(Boolean);
          location = parts.join('');
        }
      } catch (err) {
        // ignore location extraction errors
      }

      const entry: ConsoleLogEntry = {
        severity,
        type,
        text,
        location,
        page: pageName,
        timestamp: new Date().toISOString(),
      };

      entries.push(entry);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to collect console message', error);
    }
  };

  if (typeof page?.on === 'function') {
    page.on('console', handler);
  }

  const detach = () => {
    if (typeof page?.off === 'function') {
      page.off('console', handler);
    } else if (typeof page?.removeListener === 'function') {
      page.removeListener('console', handler);
    }
  };

  return {
    handle: handler,
    getEntries: () => [...entries],
    hasCritical: () => entries.some((entry) => entry.severity === 'CRITICAL'),
    clear: () => {
      entries.splice(0, entries.length);
    },
    detach,
  };
};
