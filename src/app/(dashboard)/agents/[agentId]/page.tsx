
import { notFound } from 'next/navigation';
import { agents, invoices, payments, salesPartners } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import {
  FileText,
  DollarSign,
  User,
  Mail,
  Phone,
  MessageCircle,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InvoiceTable } from '../../invoices/_components/invoice-table';
import { PaymentFormDialog } from '../../payments/_components/payment-form-dialog';
import { PortalLinkHandler } from './_components/portal-link-handler';

export default async function AgentProfilePage({
  params,
}: {
  params: { agentId: string };
}) {
  const { agentId } = params;
  const agent = agents.find(a => a.id === agentId);

  if (!agent) {
    notFound();
  }

  const agentInvoices = invoices.filter(i => i.agentId === agent.id).sort((a,b) => Date.parse(b.date) - Date.parse(a.date));
  const agentPayments = payments.filter(p => p.agentId === agent.id).sort((a,b) => Date.parse(b.date) - Date.parse(a.date));
  const partner = salesPartners.find(p => p.id === agent.salesPartnerId);

  const kpiData = [
    { title: 'مجموع فروش', value: ` ${new Intl.NumberFormat('fa-IR').format(agent.totalSales)}`, icon: DollarSign },
    { title: 'مجموع پرداخت', value: ` ${new Intl.NumberFormat('fa-IR').format(agent.totalPayments)}`, icon: DollarSign, className: "text-green-400" },
    { title: 'بدهی فعلی', value: ` ${new Intl.NumberFormat('fa-IR').format(agent.totalDebt)}`, icon: DollarSign, className: "text-red-400" },
    { title: 'تعداد فاکتورها', value: agentInvoices.length, icon: FileText },
  ];

  return (
    <>
      <PageHeader title={`پروفایل نماینده: ${agent.name}`} />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Image
                alt={`Avatar of ${agent.name}`}
                className="aspect-square rounded-full object-cover"
                height="80"
                src={agent.avatarUrl}
                width="80"
              />
              <div className="grid gap-1">
                <CardTitle className="text-2xl">{agent.name}</CardTitle>
                <CardDescription>کد نماینده: <span className="font-code">{agent.code}</span></CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
               {partner && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>همکار فروش: <Link href="#" className="text-foreground hover:underline">{partner.name}</Link></span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{agent.contact.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{agent.contact.phone}</span>
              </div>
              {agent.contact.telegramChatId && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span>{agent.contact.telegramChatId}</span>
                </div>
              )}
              <PortalLinkHandler portalLink={agent.portalLink} />
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
                <CardTitle>خلاصه وضعیت مالی</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {kpiData.map(kpi => (
                   <div key={kpi.title} className="p-4 rounded-lg bg-muted flex flex-col">
                      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="text-sm font-medium">{kpi.title}</h3>
                        <kpi.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className={cn("text-2xl font-bold font-code", kpi.className)}>{kpi.value}</div>
                        <p className="text-xs text-muted-foreground">
                          {kpi.title.includes('فروش') || kpi.title.includes('پرداخت') ? 'تومان' : ''}
                        </p>
                      </div>
                    </div>
                ))}
              </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2 flex flex-col gap-6">
           <Card>
             <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>فاکتورهای اخیر</CardTitle>
                    <CardDescription>لیست آخرین فاکتورهای صادر شده برای این نماینده.</CardDescription>
                </div>
             </CardHeader>
            <CardContent className="p-0">
               <InvoiceTable invoices={agentInvoices.slice(0, 5)} />
            </CardContent>
          </Card>

           <Card>
             <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>پرداخت‌های اخیر</CardTitle>
                    <CardDescription>لیست آخرین پرداخت‌های ثبت شده برای این نماینده.</CardDescription>
                </div>
                <PaymentFormDialog defaultAgentId={agentId}>
                  <Button size="sm">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    ثبت پرداخت
                  </Button>
                </PaymentFormDialog>
             </CardHeader>
            <CardContent className="p-0">
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>شماره فاکتور</TableHead>
                    <TableHead>شماره مرجع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentPayments.slice(0, 5).map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-code text-green-400">{new Intl.NumberFormat('fa-IR').format(p.amount)}</TableCell>
                      <TableCell className="font-code">{new Date(p.date).toLocaleDateString('fa-IR')}</TableCell>
                      <TableCell className="font-code">{invoices.find(i => i.id === p.invoiceId)?.invoiceNumber || '---'}</TableCell>
                       <TableCell className="font-code">{p.referenceNumber || '---'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
