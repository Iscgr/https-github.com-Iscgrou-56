'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';

export type InvoiceWithAgent = {
  id: string;
  invoiceNumber: string;
  agentId: string;
  agentName: string;
  agentCode: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
};

const statusMeta: Record<InvoiceWithAgent['status'], { label: string; className: string }> = {
  DRAFT: { label: 'پیش‌نویس', className: 'bg-slate-600' },
  UNPAID: { label: 'پرداخت‌نشده', className: 'bg-yellow-500' },
  PARTIAL: { label: 'پرداخت جزئی', className: 'bg-blue-500' },
  PAID: { label: 'پرداخت‌شده', className: 'bg-green-600' },
  OVERDUE: { label: 'سررسید گذشته', className: 'bg-red-600' },
  CANCELLED: { label: 'لغوشده', className: 'bg-gray-500' },
};

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: currency === 'IRR' ? 'IRR' : 'IRR',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('ریال', 'تومان');

const formatDate = (value: string) => new Date(value).toLocaleDateString('fa-IR');

export function InvoiceTableClient({ invoices }: { invoices: InvoiceWithAgent[] }) {
  const { toast } = useToast();

  const rows = useMemo(
    () =>
      invoices.map((invoice) => ({
        ...invoice,
        formattedAmount: formatCurrency(invoice.amount, invoice.currency),
        issueDate: formatDate(invoice.issueDate),
        dueDate: formatDate(invoice.dueDate),
      })),
    [invoices],
  );

  const handleSendNotification = (invoiceNumber: string) => {
    toast({
      title: 'قابلیت در دست توسعه',
      description: `ارسال اعلان برای فاکتور ${invoiceNumber} به‌زودی در دسترس خواهد بود.`,
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>شماره فاکتور</TableHead>
          <TableHead>نماینده</TableHead>
          <TableHead>مبلغ</TableHead>
          <TableHead>تاریخ صدور</TableHead>
          <TableHead>تاریخ سررسید</TableHead>
          <TableHead>وضعیت</TableHead>
          <TableHead className="w-[90px] text-center">عملیات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((invoice) => {
          const meta = statusMeta[invoice.status];
          return (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold">{invoice.agentName}</span>
                  <span className="text-sm text-muted-foreground">{invoice.agentCode}</span>
                </div>
              </TableCell>
              <TableCell className="font-code">{invoice.formattedAmount}</TableCell>
              <TableCell>{invoice.issueDate}</TableCell>
              <TableCell>{invoice.dueDate}</TableCell>
              <TableCell>
                <Badge className={`${meta.className} text-white`}>{meta.label}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">گزینه‌ها</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>اقدامات</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleSendNotification(invoice.invoiceNumber)}>
                      ارسال اعلان
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">
              هیچ فاکتوری ثبت نشده است.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
