
'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
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
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Loader2 } from "lucide-react";
import type { Invoice, InvoiceStatus } from '@/lib/types';
import { cn } from "@/lib/utils";
import { sendInvoiceNotificationAction } from '../actions';
import { PaymentFormDialog } from '../../payments/_components/payment-form-dialog';
import { SafeHydrate } from '@/components/safe-hydrate';

const statusMap: { [key in InvoiceStatus]: { label: string; className: string } } = {
  paid: { label: 'پرداخت شده', className: 'text-green-400 bg-green-500/20 border-green-500/20' },
  unpaid: { label: 'پرداخت نشده', className: 'text-red-400 bg-red-500/20 border-red-500/20' },
  partial: { label: 'تسویه جزیی', className: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/20' },
  overdue: { label: 'سررسید گذشته', className: 'text-orange-400 bg-orange-500/20 border-orange-500/20' },
  cancelled: { label: 'لغو شده', className: 'text-gray-400 bg-gray-500/20 border-gray-500/20' },
};

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [notifyingInvoiceId, setNotifyingInvoiceId] = useState<string | null>(null);

    const handleSendNotification = (invoice: Invoice) => {
        setNotifyingInvoiceId(invoice.id);
        startTransition(async () => {
            try {
                const result = await sendInvoiceNotificationAction(invoice.id);
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
        });
    };

    if (invoices.length === 0) {
        return <div className="text-center text-muted-foreground p-8">هیچ فاکتوری یافت نشد.</div>
    }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>شماره فاکتور</TableHead>
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
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium font-code">{invoice.invoiceNumber}</TableCell>
            <TableCell>
                 <Link href={`/agents/${invoice.agentId}`} className="hover:underline">
                    {invoice.agentName}
                </Link>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn(statusMap[invoice.status].className, 'hover:bg-none')}
              >
                {statusMap[invoice.status].label}
              </Badge>
            </TableCell>
            <TableCell className="font-code">
                <SafeHydrate>
                    {new Intl.NumberFormat('fa-IR').format(invoice.amount)} تومان
                </SafeHydrate>
            </TableCell>
            <TableCell className="hidden md:table-cell font-code">
                <SafeHydrate>
                    {new Date(invoice.date).toLocaleDateString('fa-IR')}
                </SafeHydrate>
            </TableCell>
            <TableCell className="hidden md:table-cell font-code">
                <SafeHydrate>
                    {new Date(invoice.dueDate).toLocaleDateString('fa-IR')}
                </SafeHydrate>
            </TableCell>
            <TableCell>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isPending && notifyingInvoiceId === invoice.id}>
                    {(isPending && notifyingInvoiceId === invoice.id) ? <Loader2 className="h-4 w-4 animate-spin" /> :<MoreHorizontal className="h-4 w-4" />}
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>اقدامات</DropdownMenuLabel>
                  <DropdownMenuItem>مشاهده جزئیات</DropdownMenuItem>
                  
                  <PaymentFormDialog defaultAgentId={invoice.agentId} defaultInvoiceId={invoice.id}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        ثبت پرداخت
                    </DropdownMenuItem>
                  </PaymentFormDialog>

                   <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSendNotification(invoice)} disabled={isPending && notifyingInvoiceId === invoice.id}>
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
