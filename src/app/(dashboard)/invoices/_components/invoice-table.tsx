'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getInvoices } from '@/lib/data';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import type { Invoice } from '@/lib/types';
import { cn } from "@/lib/utils";
// import { sendInvoiceNotificationAction } from '../actions'; // <-- REMOVED: Action does not exist
import { PaymentFormDialog } from '../../payments/_components/payment--form-dialog';
import { SafeHydrate } from '@/components/safe-hydrate';
import { useToast } from '@/hooks/use-toast';


export function InvoiceTable() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    getInvoices().then(setInvoices);
  }, []);

  const handleSendNotification = (invoiceId: string) => {
    // This is a placeholder for the actual implementation
    toast({
        title: "قابلیت در دست ساخت",
        description: `ارسال نوتیفیکیشن برای فاکتور ${invoiceId} به زودی اضافه خواهد شد.`
    });
    // sendInvoiceNotificationAction(invoiceId); // <-- REMOVED
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusMap = {
        paid: 'bg-green-600',
        unpaid: 'bg-yellow-500',
        overdue: 'bg-red-600',
        partial: 'bg-blue-500',
        cancelled: 'bg-gray-500'
    };
    return <Badge className={cn(statusMap[status], 'text-white')}>{status}</Badge>;
  }

  return (
    <SafeHydrate>
        {/* ... (rest of the table component) */}
        {/* Inside the DropdownMenu for each row: */}
        <DropdownMenuItem onClick={() => handleSendNotification(invoice.id)}>
            ارسال نوتیفیکیشن
        </DropdownMenuItem>
    </SafeHydrate>
  );
}
