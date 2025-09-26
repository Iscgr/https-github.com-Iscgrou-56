
'use client';

import { useState } from 'react';
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { payments as initialPayments, invoices as initialInvoices, agents as initialAgents } from "@/lib/data";
import type { Payment } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(initialPayments.sort((a,b) => Date.parse(b.date) - Date.parse(a.date)));
  const [searchTerm, setSearchTerm] = useState('');

  const getAgentName = (agentId: string) => initialAgents.find(a => a.id === agentId)?.name || 'ناشناس';
  const getInvoiceNumber = (invoiceId: string) => initialInvoices.find(i => i.id === invoiceId)?.invoiceNumber || '---';

  const filteredPayments = payments.filter(payment => {
    const agentName = getAgentName(payment.agentId).toLowerCase();
    const invoiceNumber = getInvoiceNumber(payment.invoiceId).toLowerCase();
    const referenceNumber = payment.referenceNumber?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    return agentName.includes(search) || invoiceNumber.includes(search) || referenceNumber.includes(search);
  });

  return (
    <>
      <PageHeader title="مدیریت پرداخت‌ها">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                type="search"
                placeholder="جستجو در پرداخت‌ها..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </PageHeader>
      
      <Card>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نماینده</TableHead>
                <TableHead>مبلغ پرداخت</TableHead>
                <TableHead>تاریخ پرداخت</TableHead>
                <TableHead>فاکتور مربوطه</TableHead>
                <TableHead>شماره مرجع</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredPayments.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            هیچ پرداختی یافت نشد.
                        </TableCell>
                    </TableRow>
                )}
                {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                        <TableCell className="font-medium">{getAgentName(payment.agentId)}</TableCell>
                        <TableCell className="font-code text-green-400">{new Intl.NumberFormat('fa-IR').format(payment.amount)} تومان</TableCell>
                        <TableCell className="font-code">{payment.date}</TableCell>
                        <TableCell className="font-code">{getInvoiceNumber(payment.invoiceId)}</TableCell>
                        <TableCell className="font-code">{payment.referenceNumber || '---'}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
