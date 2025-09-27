import { NextResponse } from 'next/server';
import { getInvoices } from '@/lib/data';

export async function GET() {
  const invoices = await getInvoices();
  return NextResponse.json(invoices);
}
