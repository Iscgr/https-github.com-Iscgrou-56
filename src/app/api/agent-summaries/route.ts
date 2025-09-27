import { NextResponse } from 'next/server';
import { getAgentSummaries } from '@/lib/data';

export async function GET() {
  const summaries = await getAgentSummaries();
  return NextResponse.json(summaries);
}
