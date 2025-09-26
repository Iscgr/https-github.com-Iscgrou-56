
'use client';

import { useState, useEffect } from 'react';
import type { Agent, Invoice, Payment, SalesPartner } from '@/lib/types';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  ReceiptText,
  CreditCard,
  Percent,
  ClipboardList,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';

// Helper component for stat cards
const StatCard = ({ title, value, icon: Icon, description, valueClassName }: { title: string, value: string, icon: React.ElementType, description?: string, valueClassName?: string }) => (
  <Card className="bg-surface border-gray-700">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
      <Icon className="h-4 w-4 text-gray-400" />
    </CardHeader>
    <CardContent>
      <div className={cn("text-3xl font-bold font-mono text-white", valueClassName)}>
        {value}
      </div>
      {description && <p className="text-xs text-gray-400 pt-1">{description}</p>}
    </CardContent>
  </Card>
);

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fa-IR').format(amount);
};


type PortalClientPageProps = {
  initialAgent: Agent;
  initialInvoices: Invoice[];
  initialPayments: Payment[];
  partner: SalesPartner | undefined;
};

export function PortalClientPage({
  initialAgent,
  initialInvoices,
  initialPayments,
  partner,
}: PortalClientPageProps) {
  
  const [agent] = useState<Agent>(initialAgent);
  const [invoices] = useState<Invoice[]>(initialInvoices);
  const [payments] = useState<Payment[]>(initialPayments);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const commission = partner ? (agent.totalSales * partner.commissionRate) / 100 : 0;

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20 font-sans">پرداخت شده</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 font-sans">تسویه جزیی</Badge>;
      case 'overdue':
        return <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 font-sans">سررسید گذشته</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-sans">پرداخت نشده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="bg-[#0d1117] min-h-screen text-gray-300 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className='flex items-center gap-4'>
            <Logo className="h-10 w-10 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
              <p className="font-mono text-cyan-400">{agent.code}</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm">پرتال عمومی نماینده</p>
            <p className="text-xs text-gray-500">آخرین بروزرسانی: لحظاتی پیش</p>
          </div>
        </header>

        {/* Main Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard 
            title="مجموع فروش"
            value={formatCurrency(agent.totalSales)}
            icon={DollarSign}
            description="تومان"
          />
          <StatCard 
            title="بدهی کل"
            value={formatCurrency(agent.totalDebt)}
            icon={ReceiptText}
            description="تومان"
            valueClassName="text-red-400"
          />
          <StatCard 
            title="پرداختی‌ها"
            value={formatCurrency(totalPayments)}
            icon={CreditCard}
            description="تومان"
             valueClassName="text-green-400"
          />
          <StatCard 
            title="کمیسیون"
            value={formatCurrency(commission)}
            icon={Percent}
            description={`بر اساس ${partner?.commissionRate}% از فروش`}
            valueClassName="text-cyan-400"
          />
        </div>

        {/* Activity History */}
        <Card className="bg-surface border-gray-700 rounded-xl">
          <CardHeader>
            <CardTitle className="text-white">تاریخچه فعالیت</CardTitle>
            <CardDescription className="text-gray-400">صورتحساب‌ها و پرداخت‌های ثبت شده برای شما.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="invoices" dir="rtl">
              <TabsList className="grid w-full grid-cols-2 bg-[#0d1117]">
                <TabsTrigger value="invoices"><ClipboardList className="ml-2 h-4 w-4" />صورتحساب‌ها</TabsTrigger>
                <TabsTrigger value="payments"><History className="ml-2 h-4 w-4" />پرداخت‌ها</TabsTrigger>
              </TabsList>
              
              <TabsContent value="invoices" className="mt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700 hover:bg-gray-800/20">
                        <TableHead className="text-right text-gray-300">شماره</TableHead>
                        <TableHead className="text-right text-gray-300">تاریخ صدور</TableHead>
                        <TableHead className="text-right text-gray-300">مبلغ کل</TableHead>
                        <TableHead className="text-right text-gray-300">بدهی</TableHead>
                        <TableHead className="text-center text-gray-300">وضعیت</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map(invoice => (
                        <TableRow key={invoice.id} className="border-gray-700 hover:bg-gray-800/20">
                          <TableCell className="text-right font-mono text-cyan-400">{invoice.invoiceNumber}</TableCell>
                          <TableCell className="text-right font-mono">{isClient ? new Date(invoice.date).toLocaleDateString('fa-IR') : '...'}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell className="text-right font-mono text-red-400">{formatCurrency(invoice.debt)}</TableCell>
                          <TableCell className="text-center">{getStatusBadge(invoice.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="mt-4">
                 <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700 hover:bg-gray-800/20">
                          <TableHead className="text-right text-gray-300">تاریخ</TableHead>
                          <TableHead className="text-right text-gray-300">مبلغ</TableHead>
                          <TableHead className="text-right text-gray-300">فاکتور مرتبط</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map(payment => (
                          <TableRow key={payment.id} className="border-gray-700 hover:bg-gray-800/20">
                            <TableCell className="text-right font-mono">{isClient ? new Date(payment.date).toLocaleDateString('fa-IR'): '...'}</TableCell>
                            <TableCell className="text-right font-mono text-green-400">{formatCurrency(payment.amount)}</TableCell>
                            <TableCell className="text-right font-mono text-cyan-400">{payment.invoiceId}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                 </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center mt-8 text-xs text-gray-500">
            <p>کلیه حقوق این سامانه محفوظ است.</p>
        </footer>
      </div>
    </div>
  );
}
