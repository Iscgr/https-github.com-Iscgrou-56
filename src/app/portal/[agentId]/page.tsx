
'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import {
  getAgentById,
  getInvoicesByAgentId,
  getPaymentsByAgentId,
  agents as allAgents,
  invoices as allInvoices,
  payments as allPayments,
} from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DollarSign, Scale, Receipt } from 'lucide-react';
import type { Agent, Invoice, Payment } from '@/lib/types';
import { PaymentFormDialog } from '@/app/(dashboard)/payments/_components/payment-form-dialog';
import { useToast } from '@/hooks/use-toast';

const statusMap: Record<Invoice['status'], { label: string; className: string }> = {
  paid: { label: 'پرداخت شده', className: 'text-green-400 bg-green-500/20 border-green-500/20' },
  unpaid: { label: 'پرداخت نشده', className: 'text-red-400 bg-red-500/20 border-red-500/20' },
  partial: { label: 'تسویه جزیی', className: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/20' },
  overdue: { label: 'سررسید گذشته', className: 'text-orange-400 bg-orange-500/20 border-orange-500/20' },
  cancelled: { label: 'لغو شده', className: 'text-gray-400 bg-gray-500/20 border-gray-500/20' },
};

export default function AgentPortalPage({
  params,
}: {
  params: { agentId: string };
}) {
  const [agents, setAgents] = useState<Agent[]>(allAgents);
  const [invoices, setInvoices] = useState<Invoice[]>(allInvoices);
  const [payments, setPayments] = useState<Payment[]>(allPayments);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const { toast } = useToast();

  const agent = agents.find(a => a.id === params.agentId || a.publicId === params.agentId);

  if (!agent) {
    notFound();
  }
  
  const agentInvoices = invoices.filter(i => i.agentId === agent.id);
  const agentPayments = payments.filter(p => p.agentId === agent.id);

  const handlePaymentAdded = (newPayment: Payment, updatedAgent: Agent, updatedInvoice: Invoice) => {
     setPayments(prev => [newPayment, ...prev].sort((a,b) => Date.parse(b.date) - Date.parse(a.date)));
     setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
     setInvoices(prev => prev.map(i => i.id === updatedInvoice.id ? updatedInvoice : i));
     toast({
        title: 'پرداخت جدید ثبت شد',
        description: `پرداخت به مبلغ ${new Intl.NumberFormat('fa-IR').format(newPayment.amount)} برای نماینده ${updatedAgent.name} ثبت شد.`,
     });
  };

  const summaryData = [
    { title: 'کل بدهی', value: `${new Intl.NumberFormat('fa-IR').format(agent.totalDebt)} تومان`, icon: Scale },
    { title: 'کل فروش', value: `${new Intl.NumberFormat('fa-IR').format(agent.totalSales)} تومان`, icon: DollarSign },
    { title: 'کل پرداخت‌ها', value: `${new Intl.NumberFormat('fa-IR').format(agent.totalPayments)} تومان`, icon: Receipt },
  ];

  return (
    <>
      <PaymentFormDialog
        isOpen={isPaymentFormOpen}
        onOpenChange={setIsPaymentFormOpen}
        onPaymentAdded={handlePaymentAdded}
        agent={agent}
        invoices={agentInvoices.filter(i => i.status === 'unpaid' || i.status === 'partial' || i.status === 'overdue')}
      />

      <div className="space-y-8">
        <PageHeader title={`پورتال مالی ${agent.name}`}>
            <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground font-code">کد نماینده: {agent.code}</div>
                <Button onClick={() => setIsPaymentFormOpen(true)}>ثبت پرداخت</Button>
            </div>
        </PageHeader>

        <div className="grid gap-4 md:grid-cols-3">
          {summaryData.map(item => (
              <Card key={item.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold font-code">{item.value}</div>
                  </CardContent>
              </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>تاریخچه فاکتورها</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره فاکتور</TableHead>
                  <TableHead>تاریخ صدور</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentInvoices.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center h-24">هیچ فاکتوری یافت نشد.</TableCell></TableRow>
                ) : agentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-code">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="font-code">{invoice.date}</TableCell>
                    <TableCell className="font-code">{new Intl.NumberFormat('fa-IR').format(invoice.amount)} تومان</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(statusMap[invoice.status].className, 'hover:bg-none')}>
                        {statusMap[invoice.status].label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تاریخچه پرداخت‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>مربوط به فاکتور</TableHead>
                  <TableHead>شماره مرجع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentPayments.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center h-24">هیچ پرداختی یافت نشد.</TableCell></TableRow>
                ) : agentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-code">{payment.date}</TableCell>
                    <TableCell className="font-code text-green-400">{new Intl.NumberFormat('fa-IR').format(payment.amount)} تومان</TableCell>
                    <TableCell className="font-code">{invoices.find(i => i.id === payment.invoiceId)?.invoiceNumber || '---'}</TableCell>
                    <TableCell className="font-code">{payment.referenceNumber || '---'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
