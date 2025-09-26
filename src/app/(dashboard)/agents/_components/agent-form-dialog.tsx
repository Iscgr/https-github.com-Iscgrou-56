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
import { useFormState, useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Loader2, PlusCircle } from 'lucide-react';
import { saveAgentAction, type AgentFormState } from '../actions';
import type { Agent, SalesPartner } from '@/lib/types';
import { getSalesPartners } from '@/lib/data';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-blue-600 hover:bg-blue-700">
      {pending ? (
        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /><span>در حال ثبت...</span></>
      ) : 'ثبت'}
    </Button>
  );
}

export function AgentFormDialog({ agent, children }: { agent?: Agent, children?: React.ReactNode }) {
  const initialState: AgentFormState = { message: '' };
  const [state, dispatch] = useFormState(saveAgentAction, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const [partners, setPartners] = useState<SalesPartner[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    getSalesPartners().then(setPartners);
  }, []);

  useEffect(() => {
    if (state.message) {
      if (state.errors) {
        toast({ variant: 'destructive', title: 'خطا در فرم', description: state.message });
      } else {
        toast({ title: 'عملیات موفق', description: state.message });
        setIsOpen(false);
      }
    }
  }, [state, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children || <Button className="bg-purple-600 hover:bg-purple-700 text-white"><PlusCircle className="mr-2" /> افزودن نماینده</Button>}</DialogTrigger>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>{agent ? 'ویرایش' : 'افزودن'} نماینده</DialogTitle>
        </DialogHeader>
        <form action={dispatch} className="space-y-4">
          <input type="hidden" name="id" value={agent?.id} />
          <div>
            <Label htmlFor="name">نام نماینده</Label>
            <Input id="name" name="name" defaultValue={agent?.name} className="bg-gray-900" />
          </div>
          <div>
            <Label htmlFor="salesPartnerId">همکار فروش</Label>
            <Select name="salesPartnerId" defaultValue={agent?.salesPartnerId || undefined}>
              <SelectTrigger className="bg-gray-900">
                <SelectValue placeholder="یک همکار فروش انتخاب کنید" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
