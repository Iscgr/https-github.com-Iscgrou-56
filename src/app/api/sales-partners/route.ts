import { NextResponse } from 'next/server';
import { getSalesPartners } from '@/lib/data';

export async function GET() {
  const partners = await getSalesPartners();
  return NextResponse.json(partners);
}
