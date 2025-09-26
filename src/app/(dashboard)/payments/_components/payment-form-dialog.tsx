
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { recordPayment, type PaymentFormState } from '../actions';
import { agents as allAgents, invoices as allInvoices, payments } from '@/lib/data';

type Props = {
  children?: React.ReactNode;
  defaultAgentId?: string;
  defaultInvoiceId?: string;
};

const initialState: PaymentFormState = {
    message: '',
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            ثبت پرداخت
        </Button>
    )
}

export function PaymentFormDialog({ children, defaultAgentId, defaultInvoiceId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(defaultAgentId || '');
  const [state, formAction] = useActionState(recordPayment, initialState);
  const { toast } = useToast();

  const availableInvoices = useMemo(() => {
    if (!selectedAgentId) return [];
    return allInvoices.filter(i => i.agentId === selectedAgentId && i.status !== 'paid');
  }, [selectedAgentId]);

  useEffect(() => {
    if (state.message && !state.errors) {
        toast({
            title: 'پرداخت ثبت شد',
            description: state.message,
        });
        setIsOpen(false);
    } else if (state.message) {
        toast({
            variant: 'destructive',
            title: 'خطا در ثبت پرداخت',
            description: state.message
        })
    }
  }, [state, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children ?? <Button>ثبت پرداخت جدید</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>ثبت پرداخت جدید</DialogTitle>
          <DialogDescription>
            مبلغ و فاکتور مربوط به این پرداخت را مشخص کنید.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} key={selectedAgentId}>
            <div className="space-y-4 py-4">
                 <div className="space-y-2">
                    <Label htmlFor="agentId">نماینده</Label>
                    <Select name="agentId" required value={selectedAgentId} onValueChange={setSelectedAgentId}>
                        <SelectTrigger id="agentId">
                            <SelectValue placeholder="یک نماینده را انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                            {allAgents.map(agent => (
                                <SelectItem key={agent.id} value={agent.id}>
                                    {agent.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {state.errors?.agentId && <p className="text-xs text-red-500">{state.errors.agentId[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="invoiceId">فاکتور</Label>
                    <Select name="invoiceId" required defaultValue={defaultInvoiceId} disabled={!selectedAgentId}>
                        <SelectTrigger id="invoiceId">
                            <SelectValue placeholder="یک فاکتور پرداخت‌نشده را انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                           {availableInvoices.length === 0 ? (
                                <SelectItem value="none" disabled>
                                    {selectedAgentId ? "فاکتور پرداخت‌نشده‌ای یافت نشد." : "ابتدا یک نماینده انتخاب کنید."}
                                </SelectItem>
                           ) : availableInvoices.map(invoice => (
                                <SelectItem key={invoice.id} value={invoice.id}>
                                    {invoice.invoiceNumber} - مانده: {new Intl.NumberFormat('fa-IR').format(invoice.amount - (payments.filter(p => p.invoiceId === invoice.id).reduce((sum, p) => sum + p.amount, 0)))} تومان
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {state.errors?.invoiceId && <p className="text-xs text-red-500">{state.errors.invoiceId[0]}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">مبلغ پرداخت (تومان)</Label>
                        <Input id="amount" name="amount" type="number" placeholder="مثال: 500000" required dir="ltr" />
                        {state.errors?.amount && <p className="text-xs text-red-500">{state.errors.amount[0]}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="paymentDate">تاریخ پرداخت</Label>
                        <Input id="paymentDate" name="paymentDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                         {state.errors?.paymentDate && <p className="text-xs text-red-500">{state.errors.paymentDate[0]}</p>}
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="referenceNumber">شماره مرجع/پیگیری (اختیاری)</Label>
                    <Input id="referenceNumber" name="referenceNumber" placeholder="مثال: 123456789" dir="ltr" />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">انصراف</Button>
                </DialogClose>
                <SubmitButton />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
