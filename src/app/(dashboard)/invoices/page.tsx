
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { invoices } from "@/lib/data";
import { InvoiceTable } from "./_components/invoice-table";
import { UploadUsageDataDialog } from './_components/upload-usage-data-dialog';
import type { InvoiceStatus } from "@/lib/types";

const statusMap: { [key in InvoiceStatus]: string } = {
  paid: 'پرداخت شده',
  unpaid: 'پرداخت نشده',
  partial: 'تسویه جزیی',
  overdue: 'سررسید گذشته',
  cancelled: 'لغو شده',
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {

  const status = searchParams?.status || 'all';
  
  const sortedInvoices = [...invoices].sort((a,b) => Date.parse(b.date) - Date.parse(a.date));

  const filteredInvoices = status === 'all' 
    ? sortedInvoices 
    : sortedInvoices.filter(i => i.status === status);

  return (
    <>
      <PageHeader title="مدیریت فاکتورها">
        <UploadUsageDataDialog />
      </PageHeader>
      
      <Tabs defaultValue={status}>
         <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="all">همه</TabsTrigger>
            <TabsTrigger value="unpaid">پرداخت نشده</TabsTrigger>
            <TabsTrigger value="paid">پرداخت شده</TabsTrigger>
            <TabsTrigger value="partial">تسویه جزیی</TabsTrigger>
            <TabsTrigger value="overdue">سررسید گذشته</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Card>
        <CardContent className="p-0">
          <InvoiceTable invoices={filteredInvoices} />
        </CardContent>
      </Card>
    </>
  );
}
