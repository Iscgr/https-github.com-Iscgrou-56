import { NextResponse } from 'next/server';

import { getMetricsRegistry, getMetricsSnapshot } from '@/lib/observability/metrics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const body = await getMetricsSnapshot();
  const registry = getMetricsRegistry();

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': registry.contentType,
      'Cache-Control': 'no-store',
    },
  });
}
