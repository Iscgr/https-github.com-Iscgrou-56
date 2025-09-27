
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPayments, getInvoices, getAgents } from "@/lib/data";
import { PaymentFormDialog } from "./_components/payment-form-dialog";
import { Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const searchTerm = resolvedSearchParams.q || '';

  const [paymentsList, invoicesList, agentsList] = await Promise.all([
    getPayments(),
    getInvoices(),
    getAgents(),
  ]);

  const getAgentName = (agentId: string) => agentsList.find(a => a.id === agentId)?.name || 'ناشناس';
  const getInvoiceNumber = (invoiceId: string | null | undefined) =>
    invoiceId ? invoicesList.find(i => i.id === invoiceId)?.invoiceNumber || '---' : '---';

  const filteredPayments = paymentsList
    .filter(payment => {
      if (!searchTerm) return true;
      const agentName = getAgentName(payment.agentId).toLowerCase();
      const invoiceNumber = getInvoiceNumber(payment.invoiceId).toLowerCase();
      const referenceNumber = payment.reference?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();

      return agentName.includes(search) || invoiceNumber.includes(search) || referenceNumber.includes(search);
    })
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));

  return (
    <>
      <PageHeader title="مدیریت پرداخت‌ها">
        <div className="flex flex-wrap items-center gap-2">
          <form className="flex items-center gap-2">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                      type="search"
                      name="q"
                      placeholder="جستجو در پرداخت‌ها..."
                      className="pl-9"
                      defaultValue={searchTerm}
                  />
              </div>
              <Button type="submit">جستجو</Button>
          </form>
          <PaymentFormDialog>
            <Button type="button" variant="secondary">ثبت پرداخت جدید</Button>
          </PaymentFormDialog>
        </div>
      </PageHeader>
      
      <Card>
        <CardContent className="p-0">
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نماینده</TableHead>
                <TableHead>مبلغ پرداخت</TableHead>
                <TableHead>تاریخ پرداخت</TableHead>
                <TableHead>فاکتور مربوطه</TableHead>
                <TableHead>شماره مرجع</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredPayments.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            هیچ پرداختی یافت نشد.
                        </TableCell>
                    </TableRow>
                )}
                {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                        <TableCell className="font-medium">{getAgentName(payment.agentId)}</TableCell>
                        <TableCell className="font-code text-green-400">{new Intl.NumberFormat('fa-IR').format(payment.amount)} تومان</TableCell>
                        <TableCell className="font-code">{new Date(payment.recordedAt).toLocaleDateString('fa-IR')}</TableCell>
                        <TableCell className="font-code">{getInvoiceNumber(payment.invoiceId)}</TableCell>
                        <TableCell className="font-code">{payment.reference || '---'}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
