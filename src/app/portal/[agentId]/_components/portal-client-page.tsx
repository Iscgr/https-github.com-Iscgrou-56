
'use client';

import type { Agent, Invoice, Payment } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  CreditCard, 
  DollarSign, 
  AlertCircle, 
  ArrowRightLeft, 
  CalendarClock,
  CheckCircle2
} from 'lucide-react';

type PortalClientPageProps = {
  agent: Agent;
  portalData: {
    invoices: Invoice[];
    payments: Payment[];
    summary: {
      totalBilled: number;
      totalPaid: number;
      balance: number;
      invoiceCount: number;
    };
  };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(Math.round(value)) + ' ریال';

const formatDate = (value: string) => new Date(value).toLocaleDateString('fa-IR');

export default function PortalClientPage({ agent, portalData }: PortalClientPageProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-10 space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-700 pb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              پرتال نمایندگی {agent.name}
              <Badge className="bg-blue-600 ml-2 text-white text-xs">{agent.code}</Badge>
            </h1>
            <p className="text-gray-400 mt-2">
              وضعیت مالی و فاکتورهای جاری شما در یک نگاه
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Badge className={agent.status === 'ACTIVE' ? 'bg-green-600' : 
                            agent.status === 'SUSPENDED' ? 'bg-yellow-500' : 
                            'bg-red-600'}>
              {agent.status === 'ACTIVE' ? 'حساب فعال' : 
               agent.status === 'SUSPENDED' ? 'حساب معلق' : 
               'حساب غیرفعال'}
            </Badge>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center text-green-400 mb-2">
                <FileText className="mr-2 h-5 w-5" />
                <CardDescription className="text-green-400">مجموع فاکتورهای صادر شده</CardDescription>
              </div>
              <CardTitle className="text-xl">{formatCurrency(portalData.summary.totalBilled)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center text-green-400 mb-2">
                <CreditCard className="mr-2 h-5 w-5" />
                <CardDescription className="text-green-400">پرداخت‌های ثبت شده</CardDescription>
              </div>
              <CardTitle className="text-xl">{formatCurrency(portalData.summary.totalPaid)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center text-red-400 mb-2">
                <DollarSign className="mr-2 h-5 w-5" />
                <CardDescription className="text-red-400">مانده بدهی</CardDescription>
              </div>
              <CardTitle className="text-xl text-red-500">
                {formatCurrency(Math.max(portalData.summary.balance, 0))}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center text-blue-400 mb-2">
                <FileText className="mr-2 h-5 w-5" />
                <CardDescription className="text-blue-400">تعداد فاکتورها</CardDescription>
              </div>
              <CardTitle className="text-xl">{portalData.summary.invoiceCount}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-blue-400" />
                  <CardTitle>فاکتورهای اخیر</CardTitle>
                </div>
                <Badge variant="outline" className="border-blue-500 text-blue-400">
                  {portalData.invoices.length} فاکتور
                </Badge>
              </div>
              <CardDescription className="text-gray-400">آخرین فاکتورهای صادر شده برای شما</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {portalData.invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between border border-gray-700 rounded-md px-4 py-3 bg-gray-900/50 hover:bg-gray-900">
                  <div>
                    <p className="font-semibold">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-400 flex items-center mt-1">
                      <CalendarClock className="h-3 w-3 mr-1" /> سررسید: {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-code font-medium">{formatCurrency(invoice.amount)}</p>
                    <Badge 
                      className={
                        invoice.status === 'PAID' ? 'bg-green-600' : 
                        invoice.status === 'PARTIAL' ? 'bg-blue-600' :
                        invoice.status === 'OVERDUE' ? 'bg-red-600' :
                        invoice.status === 'UNPAID' ? 'bg-yellow-600' :
                        invoice.status === 'DRAFT' ? 'bg-gray-600' : 
                        'bg-gray-600'
                      }
                    >
                      {
                        invoice.status === 'PAID' ? 'پرداخت شده' : 
                        invoice.status === 'PARTIAL' ? 'پرداخت جزئی' :
                        invoice.status === 'OVERDUE' ? 'سررسید شده' :
                        invoice.status === 'UNPAID' ? 'پرداخت نشده' :
                        invoice.status === 'DRAFT' ? 'پیش‌نویس' : 
                        invoice.status
                      }
                    </Badge>
                  </div>
                </div>
              ))}
              {portalData.invoices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <AlertCircle className="h-10 w-10 mb-2" />
                  <p>هنوز فاکتوری ثبت نشده است</p>
                </div>
              )}
            </CardContent>
            {portalData.invoices.length > 5 && (
              <CardFooter className="border-t border-gray-700 pt-4">
                <button className="text-blue-400 hover:underline w-full text-center">
                  مشاهده همه فاکتورها ({portalData.invoices.length})
                </button>
              </CardFooter>
            )}
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ArrowRightLeft className="mr-2 h-5 w-5 text-green-400" />
                  <CardTitle>پرداخت‌های اخیر</CardTitle>
                </div>
                <Badge variant="outline" className="border-green-500 text-green-400">
                  {portalData.payments.length} پرداخت
                </Badge>
              </div>
              <CardDescription className="text-gray-400">آخرین پرداخت‌های ثبت شده برای شما</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {portalData.payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between border border-gray-700 rounded-md px-4 py-3 bg-gray-900/50 hover:bg-gray-900">
                  <div>
                    <p className="font-semibold flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1 text-green-400" />
                      {formatDate(payment.recordedAt)}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      مرجع: {payment.reference ?? '---'}
                    </p>
                  </div>
                  <p className="font-code text-green-400 font-medium">{formatCurrency(payment.amount)}</p>
                </div>
              ))}
              {portalData.payments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <AlertCircle className="h-10 w-10 mb-2" />
                  <p>پرداختی ثبت نشده است</p>
                </div>
              )}
            </CardContent>
            {portalData.payments.length > 5 && (
              <CardFooter className="border-t border-gray-700 pt-4">
                <button className="text-green-400 hover:underline w-full text-center">
                  مشاهده همه پرداخت‌ها ({portalData.payments.length})
                </button>
              </CardFooter>
            )}
          </Card>
        </section>
        
        <div className="border-t border-gray-700 pt-6 text-center text-gray-400 text-sm">
          <p>پرتال عمومی نماینده | مرفانت | آخرین بروزرسانی: {formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </div>
  );
}
