
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Agent, Invoice, Payment, SalesPartner } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  FilePen,
  ExternalLink,
  Mail,
  Phone,
  MessageSquare,
  Users,
  Percent,
  ClipboardList,
  History,
  MessageCircle,
  DollarSign,
  ReceiptText,
  PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentFormDialog } from '../../../payments/_components/payment-form-dialog';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '@/components/ui/dialog';
  import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from '@/components/ui/form';
  import { Input } from '@/components/ui/input';

// Helper component for detail items
const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
    <div className="flex flex-col">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-md font-medium break-all">{value}</span>
    </div>
  </div>
);

const formSchema = z.object({
    name: z.string().min(1, { message: 'وارد کردن نام الزامی است' }),
    email: z.string().email({ message: 'ایمیل معتبر نیست' }),
    phone: z.string().min(1, { message: 'وارد کردن تلفن الزامی است' }),
    telegramChatId: z.string().optional(),
  });

type AgentProfileClientPageProps = {
  initialAgent: Agent;
  initialInvoices: Invoice[];
  initialPayments: Payment[];
  partner: SalesPartner | undefined;
};

export function AgentProfileClientPage({
  initialAgent,
  initialInvoices,
  initialPayments,
  partner,
}: AgentProfileClientPageProps) {
  
  const [agent, setAgent] = useState<Agent>(initialAgent);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: agent.name,
      email: agent.contact.email,
      phone: agent.contact.phone,
      telegramChatId: agent.contact.telegramChatId,
    },
  });

  useEffect(() => {
    setIsClient(true)
  }, [])

  const commission = partner ? (agent.totalSales * partner.commissionRate) / 100 : 0;

  const handlePaymentAdded = (newPayment: Payment, updatedAgent: Agent, updatedInvoice: Invoice) => {
     setPayments(prev => [newPayment, ...prev].sort((a,b) => Date.parse(b.date) - Date.parse(a.date)));
     setAgent(updatedAgent);
     setInvoices(prev => prev.map(i => i.id === updatedInvoice.id ? updatedInvoice : i));
     toast({
        title: 'پرداخت جدید ثبت شد',
        description: `پرداخت به مبلغ ${new Intl.NumberFormat('fa-IR').format(newPayment.amount)} برای نماینده ${updatedAgent.name} ثبت شد.`,
     });
  };

  const handleAgentUpdate = (values: z.infer<typeof formSchema>) => {
    const updatedAgent: Agent = {
        ...agent,
        name: values.name,
        contact: {
            ...agent.contact,
            email: values.email,
            phone: values.phone,
            telegramChatId: values.telegramChatId
        }
    }
    setAgent(updatedAgent);
    setIsEditFormOpen(false);
    toast({
      title: 'پروفایل نماینده به‌روزرسانی شد',
      description: `اطلاعات ${updatedAgent.name} با موفقیت ذخیره شد.`,
    });
  };

  return (
    <>
      <PaymentFormDialog
        isOpen={isPaymentFormOpen}
        onOpenChange={setIsPaymentFormOpen}
        onPaymentAdded={handlePaymentAdded}
        agent={agent}
        invoices={invoices.filter(i => i.status === 'unpaid' || i.status === 'partial' || i.status === 'overdue')}
      />

<Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ویرایش پروفایل نماینده</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAgentUpdate)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام</FormLabel>
                  <FormControl>
                    <Input placeholder="نام نماینده" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ایمیل</FormLabel>
                  <FormControl>
                    <Input placeholder="ایمیل نماینده" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تلفن</FormLabel>
                  <FormControl>
                    <Input placeholder="تلفن نماینده" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telegramChatId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>آیدی تلگرام</FormLabel>
                  <FormControl>
                    <Input placeholder="آیدی تلگرام" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">ذخیره تغییرات</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image
              alt={`آواتار ${agent.name}`}
              className="aspect-square rounded-full object-cover"
              height="80"
              src={agent.avatarUrl}
              width="80"
            />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{agent.name}</h1>
                <Badge
                  className={cn(
                      agent.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20',
                      'hover:bg-none text-xs'
                    )}
                >
                  {agent.status === 'active' ? 'فعال' : 'غیرفعال'}
                </Badge>
              </div>
              <p className="text-md text-muted-foreground font-code">{agent.code}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <Button onClick={() => setIsPaymentFormOpen(true)}>
              <PlusCircle className="ml-2 h-4 w-4" />
              ثبت پرداخت
            </Button>
            <Button variant="outline" onClick={() => setIsEditFormOpen(true)}>
                <FilePen className="ml-2 h-4 w-4" />
                ویرایش پروفایل
            </Button>
            <Button asChild variant="outline">
              <Link href={`/portal/${agent.id}`} target="_blank">
                <ExternalLink className="ml-2 h-4 w-4" />
                مشاهده پورتال
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Main Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مجموع فروش</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-code">
                {new Intl.NumberFormat('fa-IR').format(agent.totalSales)}
              </div>
              <p className="text-xs text-muted-foreground">تومان</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">بدهی کل</CardTitle>
              <ReceiptText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-code text-red-400">
                {new Intl.NumberFormat('fa-IR').format(agent.totalDebt)}
              </div>
              <p className="text-xs text-muted-foreground">
                کمیسیون محاسبه شده: {new Intl.NumberFormat('fa-IR').format(commission)} تومان
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات تماس</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem icon={Mail} label="ایمیل" value={<a href={`mailto:${agent.contact.email}`} className="text-primary hover:underline">{agent.contact.email}</a>} />
              <DetailItem icon={Phone} label="تلفن" value={agent.contact.phone} />
              {agent.contact.telegramChatId && <DetailItem icon={MessageSquare} label="آیدی تلگرام" value={agent.contact.telegramChatId} />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>همکار فروش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {partner ? (
                <>
                  <DetailItem icon={Users} label="نام همکار" value={partner.name} />
                  <DetailItem icon={Percent} label="نرخ کمیسیون" value={`${partner.commissionRate}%`} />
                </>
              ) : (
                <DetailItem icon={Users} label="نام همکار" value="—" />
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Activity History */}
        <Card>
          <CardHeader>
            <CardTitle>تاریخچه فعالیت</CardTitle>
            <CardDescription>صورتحساب‌ها، پرداخت‌ها و یادداشت‌های ثبت شده برای این نماینده.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="invoices">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="invoices"><ClipboardList className="ml-2 h-4 w-4" />صورتحساب‌ها</TabsTrigger>
                <TabsTrigger value="payments"><History className="ml-2 h-4 w-4" />پرداخت‌ها</TabsTrigger>
                <TabsTrigger value="notes"><MessageCircle className="ml-2 h-4 w-4" />یادداشت‌ها</TabsTrigger>
              </TabsList>
              <TabsContent value="invoices" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>شماره</TableHead>
                      <TableHead>تاریخ صدور</TableHead>
                      <TableHead>مبلغ</TableHead>
                      <TableHead>وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-code">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{isClient ? new Date(invoice.date).toLocaleDateString('fa-IR') : ''}</TableCell>
                        <TableCell className="font-code">{new Intl.NumberFormat('fa-IR').format(invoice.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{invoice.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="payments" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>تاریخ</TableHead>
                      <TableHead>مبلغ</TableHead>
                      <TableHead>شماره فاکتور</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>{isClient ? new Date(payment.date).toLocaleDateString('fa-IR'): ''}</TableCell>
                        <TableCell className="font-code">{new Intl.NumberFormat('fa-IR').format(payment.amount)}</TableCell>
                        <TableCell className="font-code">{payment.invoiceId}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="notes" className="mt-4 space-y-4">
                <div className="space-y-2">
                    <label htmlFor="note" className="text-sm font-medium">یادداشت جدید</label>
                    <Textarea id="note" placeholder="یادداشت خود را اینجا بنویسید..." className="min-h-[100px]" />
                </div>
                <Button>افزودن یادداشت</Button>
                <div className="border-t pt-4 mt-4">
                    <p className="text-sm text-center text-muted-foreground">هنوز یادداشتی ثبت نشده است.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
