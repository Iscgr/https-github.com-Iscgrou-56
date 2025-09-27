import { NextResponse } from 'next/server';
import { getPayments } from '@/lib/data';

export async function GET() {
  const payments = await getPayments();
  return NextResponse.json(payments);
}
