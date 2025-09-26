import { notFound } from 'next/navigation';
import {
  getAgentById,
  getInvoicesByAgentId,
  getPaymentsByAgentId,
} from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
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
import { cn } from '@/lib/utils';
import { DollarSign, Scale, Receipt } from 'lucide-react';

const statusMap = {
  paid: { label: 'پرداخت شده', className: 'text-green-400 bg-green-500/20 border-green-500/20' },
  unpaid: { label: 'پرداخت نشده', className: 'text-red-400 bg-red-500/20 border-red-500/20' },
  partial: { label: 'تسویه جزیی', className: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/20' },
  overdue: { label: 'سررسید گذشته', className: 'text-orange-400 bg-orange-500/20 border-orange-500/20' },
};

export default function AgentPortalPage({
  params,
}: {
  params: { agentId: string };
}) {
  const agent = getAgentById(params.agentId);
  if (!agent) {
    notFound();
  }

  const invoices = getInvoicesByAgentId(params.agentId);
  const payments = getPaymentsByAgentId(params.agentId);
  const totalDebt = agent.totalSales - agent.totalPayments;

  const summaryData = [
    { title: 'کل بدهی', value: `${new Intl.NumberFormat('fa-IR').format(totalDebt)} تومان`, icon: Scale },
    { title: 'کل فروش', value: `${new Intl.NumberFormat('fa-IR').format(agent.totalSales)} تومان`, icon: DollarSign },
    { title: 'کل پرداخت‌ها', value: `${new Intl.NumberFormat('fa-IR').format(agent.totalPayments)} تومان`, icon: Receipt },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={`پورتال مالی ${agent.name}`} />

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
                <TableHead>شناسه</TableHead>
                <TableHead>تاریخ صدور</TableHead>
                <TableHead>مبلغ</TableHead>
                <TableHead>وضعیت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-code">{invoice.id}</TableCell>
                  <TableCell className="font-code">{invoice.date}</TableCell>
                  <TableCell className="font-code">{new Intl.NumberFormat('fa-IR').format(invoice.amount)}</TableCell>
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
                <TableHead>شناسه</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead>مبلغ</TableHead>
                <TableHead>مربوط به فاکتور</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-code">{payment.id}</TableCell>
                  <TableCell className="font-code">{payment.date}</TableCell>
                  <TableCell className="font-code text-green-400">{new Intl.NumberFormat('fa-IR').format(payment.amount)}</TableCell>
                  <TableCell className="font-code">{payment.invoiceId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
