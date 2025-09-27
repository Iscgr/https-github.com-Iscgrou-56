'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

import { recordPayment, type PaymentFormState } from '../actions';
import type { Agent } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  children?: React.ReactNode;
};

const paymentMethods = [
  { value: 'EXTERNAL', label: 'واریز بانکی' },
  { value: 'INTERNAL_SETTLEMENT', label: 'تسویه از کیف پول' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>در حال ثبت...</span>
        </>
      ) : (
        'ثبت پرداخت'
      )}
    </Button>
  );
}

export function PaymentFormDialog({ children }: Props) {
  const initialState: PaymentFormState = { message: '' };
  const [state, dispatch] = useFormState(recordPayment, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [defaultDate, setDefaultDate] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Set default date to avoid hydration mismatch
    setDefaultDate(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    let active = true;

    const loadAgents = async () => {
      try {
        const response = await fetch('/api/agents', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to fetch agents: ${response.status}`);
        }
        const data = (await response.json()) as Agent[];
        if (active) {
          setAgents(data);
        }
      } catch (error) {
        console.error('Failed to load agents', error);
        toast({
          variant: 'destructive',
          title: 'خطا در دریافت نمایندگان',
          description: 'بارگیری فهرست نمایندگان با مشکل مواجه شد.',
        });
      }
    };

    loadAgents();

    return () => {
      active = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!state.message) return;

    if (state.errors) {
      toast({
        variant: 'destructive',
        title: 'خطا در فرم',
        description: state.message,
      });
      return;
    }

    toast({
      title: 'عملیات موفق',
      description: state.message,
    });
    setIsOpen(false);
  }, [state, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children || <Button>پرداخت جدید</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>ثبت پرداخت جدید</DialogTitle>
          <DialogDescription>
            مبلغ و روش پرداخت را وارد کنید تا در سامانه ثبت شود.
          </DialogDescription>
        </DialogHeader>
        <form action={dispatch} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agentId">نماینده</Label>
            <Select name="agentId" required>
              <SelectTrigger id="agentId">
                <SelectValue placeholder="یک نماینده را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">مبلغ پرداخت</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="1000"
              placeholder="مثلاً ۵۰۰۰۰۰۰"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">روش پرداخت</Label>
            <Select name="paymentMethod" defaultValue="EXTERNAL">
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="روش پرداخت" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">تاریخ پرداخت</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={defaultDate}
              required
            />
          </div>

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
