import { Prisma, PrismaClient } from '@/generated/prisma';

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA_CLIENT__: PrismaClient | undefined;
}

const createPrismaClient = () => {
  const emitQueryEvents = process.env.LOG_PRISMA_QUERIES === '1';
  const client = new PrismaClient({
    log: emitQueryEvents
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ]
      : ['warn', 'error'],
  });

  if (emitQueryEvents) {
    client.$on('query', (event: Prisma.QueryEvent) => {
      console.debug('[prisma][query]', {
        durationMs: event.duration,
        query: event.query,
        params: event.params,
      });
    });
  }

  client.$on('warn', (event: Prisma.LogEvent) => {
    console.warn('[prisma][warn]', event);
  });

  client.$on('error', (event: Prisma.LogEvent) => {
    console.error('[prisma][error]', event);
  });

  return client;
};

export const prisma: PrismaClient =
  globalThis.__PRISMA_CLIENT__ ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__PRISMA_CLIENT__ = prisma;
}

export type PrismaDbClient = PrismaClient | Prisma.TransactionClient;
