
'use client';

import { useState } from 'react';
import { MoreHorizontal, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { invoices as initialInvoices } from "@/lib/data";
import type { Invoice } from '@/lib/types';
import { cn } from "@/lib/utils";
import { UploadUsageDataDialog } from './_components/upload-usage-data-dialog';
import { useToast } from '@/hooks/use-toast';
import { sendInvoiceNotification } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const statusMap = {
  paid: { label: 'پرداخت شده', className: 'text-green-400 bg-green-500/20 border-green-500/20' },
  unpaid: { label: 'پرداخت نشده', className: 'text-red-400 bg-red-500/20 border-red-500/20' },
  partial: { label: 'تسویه جزیی', className: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/20' },
  overdue: { label: 'سررسید گذشته', className: 'text-orange-400 bg-orange-500/20 border-orange-500/20' },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const handleNewInvoices = (newInvoices: Invoice[]) => {
    setInvoices(prevInvoices => [...newInvoices, ...prevInvoices].sort((a,b) => Date.parse(b.date) - Date.parse(a.date)));
  };

  return (
    <Tabs defaultValue="all">
      <PageHeader title="مدیریت فاکتورها">
        <div className="flex items-center gap-2">
            <Button asChild variant="outline">
                <Link href="/settings">رفتن به تنظیمات</Link>
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              بارگذاری و پردازش فایل مصرف
            </Button>
        </div>
      </PageHeader>
      
      <UploadUsageDataDialog
        isOpen={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onNewInvoices={handleNewInvoices}
      />
      
      <TabsList className="grid w-full grid-cols-5 mb-4">
        <TabsTrigger value="all">همه</TabsTrigger>
        <TabsTrigger value="unpaid">پرداخت نشده</TabsTrigger>
        <TabsTrigger value="paid">پرداخت شده</TabsTrigger>
        <TabsTrigger value="partial">تسویه جزیی</TabsTrigger>
        <TabsTrigger value="overdue">سررسید گذشته</TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <Card>
          <CardContent>
            <InvoiceTable invoiceList={invoices} />
          </CardContent>
        </Card>
      </TabsContent>
       {Object.keys(statusMap).map(status => (
        <TabsContent key={status} value={status}>
            <Card>
                <CardContent>
                    <InvoiceTable invoiceList={invoices.filter(i => i.status === status)} />
                </CardContent>
            </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function InvoiceTable({ invoiceList }: { invoiceList: Invoice[] }) {
    const { toast } = useToast();
    const [notifyingInvoiceId, setNotifyingInvoiceId] = useState<string | null>(null);

    const handleSendNotification = async (invoice: Invoice) => {
        setNotifyingInvoiceId(invoice.id);
        try {
            // The action now reads settings from the server, no need to pass them.
            const result = await sendInvoiceNotification({ invoice });

            if (result.success) {
                toast({
                    title: 'نوتیفیکیشن ارسال شد',
                    description: `پیام با موفقیت برای ${invoice.agentName} ارسال شد.`,
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'خطا در ارسال',
                    description: result.message,
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'خطای ناشناخته',
                description: error instanceof Error ? error.message : 'مشکلی در ارسال نوتیفیکیشن پیش آمد.',
            });
        } finally {
            setNotifyingInvoiceId(null);
        }
    };


    if (invoiceList.length === 0) {
        return <div className="text-center text-muted-foreground p-8">هیچ فاکتوری یافت نشد.</div>
    }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>شناسه فاکتور</TableHead>
          <TableHead>نماینده</TableHead>
          <TableHead>وضعیت</TableHead>
          <TableHead>مبلغ</TableHead>
          <TableHead className="hidden md:table-cell">تاریخ صدور</TableHead>
          <TableHead className="hidden md:table-cell">تاریخ سررسید</TableHead>
          <TableHead>
            <span className="sr-only">اقدامات</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoiceList.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium font-code">{invoice.id}</TableCell>
            <TableCell>{invoice.agentName}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn(statusMap[invoice.status as keyof typeof statusMap].className, 'hover:bg-none')}
              >
                {statusMap[invoice.status as keyof typeof statusMap].label}
              </Badge>
            </TableCell>
            <TableCell className="font-code">{new Intl.NumberFormat('fa-IR').format(invoice.amount)} تومان</TableCell>
            <TableCell className="hidden md:table-cell font-code">{invoice.date}</TableCell>
            <TableCell className="hidden md:table-cell font-code">{invoice.dueDate}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost" disabled={notifyingInvoiceId === invoice.id}>
                    {notifyingInvoiceId === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> :<MoreHorizontal className="h-4 w-4" />}
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>اقدامات</DropdownMenuLabel>
                  <DropdownMenuItem>مشاهده جزئیات</DropdownMenuItem>
                  <DropdownMenuItem>ثبت پرداخت</DropdownMenuItem>
                   <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSendNotification(invoice)} disabled={notifyingInvoiceId === invoice.id}>
                    ارسال نوتیفیکیشن تلگرام
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
