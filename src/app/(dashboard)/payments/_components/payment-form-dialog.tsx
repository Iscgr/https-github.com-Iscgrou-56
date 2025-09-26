
'use client';

import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
import type { Agent, Invoice, Payment } from '@/lib/types';

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPaymentAdded: (payment: Payment, agent: Agent, invoice: Invoice) => void;
  agent?: Agent;
  invoices: Invoice[];
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

export function PaymentFormDialog({ isOpen, onOpenChange, onPaymentAdded, agent, invoices, defaultInvoiceId }: Props) {
  const [state, formAction] = useActionState(recordPayment, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && !state.errors) {
        if(state.payment && state.updatedAgent && state.updatedInvoice) {
            onPaymentAdded(state.payment, state.updatedAgent, state.updatedInvoice);
        }
        onOpenChange(false);
    } else if (state.message && state.errors) {
        toast({
            variant: 'destructive',
            title: 'خطا در فرم',
            description: state.message
        })
    }
  }, [state, onOpenChange, onPaymentAdded, toast]);
  
  if (!agent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>ثبت پرداخت برای {agent.name}</DialogTitle>
          <DialogDescription>
            مبلغ و فاکتور مربوط به این پرداخت را مشخص کنید.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
            <input type="hidden" name="agentId" value={agent.id} />
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="invoiceId">فاکتور</Label>
                    <Select name="invoiceId" required defaultValue={defaultInvoiceId}>
                        <SelectTrigger id="invoiceId">
                            <SelectValue placeholder="یک فاکتور پرداخت‌نشده را انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                           {invoices.length === 0 ? (
                                <SelectItem value="none" disabled>
                                    هیچ فاکتور پرداخت نشده‌ای برای این نماینده وجود ندارد.
                                </SelectItem>
                           ) : invoices.map(invoice => (
                                <SelectItem key={invoice.id} value={invoice.id}>
                                    {invoice.invoiceNumber} - مبلغ: {new Intl.NumberFormat('fa-IR').format(invoice.amount)} تومان
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
