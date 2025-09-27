'use client';

import {
  Dialog,
  DialogContent,
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
import { saveAgentAction } from '../actions';
import type { Agent, Partner } from '@/lib/types';

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

export function AgentFormDialog({ agent, children }: { agent?: Agent; children?: React.ReactNode }) {
  const initialState = { message: '', success: false };
  const [state, dispatch] = useFormState(saveAgentAction, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    let active = true;

    const loadPartners = async () => {
      try {
        const response = await fetch('/api/sales-partners', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to fetch partners: ${response.status}`);
        }
        const data = (await response.json()) as Partner[];
        if (active) {
          setPartners(data);
        }
      } catch (error: unknown) {
        console.error('Failed to load sales partners', error);
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        if (active) {
          toast({
            variant: 'destructive',
            title: 'خطا در دریافت همکاران',
            description: `بارگیری فهرست همکاران فروش با مشکل مواجه شد. (${errorMessage})`,
          });
        }
      }
    };

    loadPartners();

    return () => {
      active = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!state.message) return;

    if (!state.success) {
      toast({ variant: 'destructive', title: 'خطا در ثبت', description: state.message });
      return;
    }

    toast({ title: 'عملیات موفق', description: state.message });
    setIsOpen(false);
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
            <Label htmlFor="partnerId">همکار فروش</Label>
            <Select name="partnerId" defaultValue={agent?.partnerId ?? undefined}>
              <SelectTrigger id="partnerId" className="bg-gray-900">
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
