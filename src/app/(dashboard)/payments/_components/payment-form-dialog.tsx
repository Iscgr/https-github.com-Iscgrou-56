'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/select';
import { useFormState } from 'react-dom';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { recordPayment, type PaymentFormState } from '../actions';
// --- CHANGES START ---
// We now fetch data via useEffect instead of direct import
import { getAgents, getInvoices } from '@/lib/data';
import type { Agent, Invoice } from '@/lib/types';
// --- CHANGES END ---

type Props = {
  children?: React.ReactNode;
};

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
  const { toast } = useToast();

  // --- CHANGES START ---
  // State to hold data fetched from the server
  const [agents, setAgents] = useState<Agent[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
  
  useEffect(() => {
    // Fetch initial data when the component mounts
    async function fetchData() {
        const [agentsData, invoicesData] = await Promise.all([getAgents(), getInvoices()]);
        setAgents(agentsData);
        setInvoices(invoicesData);
    }
    fetchData();
  }, []);
  // --- CHANGES END ---

  useEffect(() => {
    if (state.message) {
      if (state.errors) {
        toast({
          variant: 'destructive',
          title: 'خطا در فرم',
          description: state.message,
        });
      } else {
        toast({
          title: 'عملیات موفق',
          description: state.message,
        });
        setIsOpen(false);
      }
    }
  }, [state, toast]);

  const agentInvoices = selectedAgentId ? invoices.filter(inv => inv.agentId === selectedAgentId && inv.status !== 'paid') : [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>ثبت پرداخت جدید</DialogTitle>
          <DialogDescription>
            مبلغ واریزی جدید یا تسویه از اعتبار داخلی را ثبت کنید.
          </DialogDescription>
        </DialogHeader>
        <form action={dispatch}>
            {/* ... (rest of the form remains, but now uses state for agents/invoices) */}
            <Select name="agentId" onValueChange={setSelectedAgentId}>
                {/* ... */}
            </Select>
            {/* ... */}
          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
