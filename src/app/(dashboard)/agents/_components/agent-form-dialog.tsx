
'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
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
import { addOrUpdateAgent, type AgentFormState } from '../actions';
import type { Agent } from '@/lib/types';
import { salesPartners } from '@/lib/data';

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAgentAdded: (agent: Agent) => void;
  agent?: Agent; // for editing in the future
};

const initialState: AgentFormState = {
    message: '',
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            ذخیره نماینده
        </Button>
    )
}


export function AgentFormDialog({ isOpen, onOpenChange, onAgentAdded, agent }: Props) {
  const [state, formAction] = useFormState(addOrUpdateAgent, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && !state.errors) {
        if(state.agent) {
            onAgentAdded(state.agent);
        }
        onOpenChange(false);
    } else if (state.message && state.errors) {
        toast({
            variant: 'destructive',
            title: 'خطا در فرم',
            description: 'لطفا خطاها را برطرف کرده و مجددا تلاش کنید.'
        })
    }
  }, [state, onOpenChange, onAgentAdded, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{agent ? 'ویرایش نماینده' : 'افزودن نماینده جدید'}</DialogTitle>
          <DialogDescription>
            اطلاعات نماینده جدید را برای افزودن به سیستم وارد کنید.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">نام کامل</Label>
                    <Input id="name" name="name" placeholder="مثال: علی رضایی" required />
                    {state.errors?.name && <p className="text-xs text-red-500">{state.errors.name[0]}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">ایمیل</Label>
                        <Input id="email" name="email" type="email" placeholder="agent@example.com" required dir="ltr"/>
                        {state.errors?.email && <p className="text-xs text-red-500">{state.errors.email[0]}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="phone">شماره تماس</Label>
                        <Input id="phone" name="phone" placeholder="09123456789" required dir="ltr"/>
                        {state.errors?.phone && <p className="text-xs text-red-500">{state.errors.phone[0]}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="telegramChatId">شناسه چت تلگرام (اختیاری)</Label>
                        <Input id="telegramChatId" name="telegramChatId" placeholder="123456789" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="salesPartnerId">همکار فروش (اختیاری)</Label>
                        <Select name="salesPartnerId" defaultValue="">
                            <SelectTrigger id="salesPartnerId">
                                <SelectValue placeholder="یک همکار فروش انتخاب کنید" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">
                                    <em>بدون همکار</em>
                                </SelectItem>
                                {salesPartners.map(partner => (
                                    <SelectItem key={partner.id} value={partner.id}>
                                        {partner.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         {state.errors?.salesPartnerId && <p className="text-xs text-red-500">{state.errors.salesPartnerId[0]}</p>}
                    </div>
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
