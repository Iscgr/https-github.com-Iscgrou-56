
'use client';

import { useEffect, useState } from 'react';
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
  DialogTrigger
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
import { Loader2, PlusCircle } from 'lucide-react';
import { addOrUpdateAgent, type AgentFormState } from '../actions';
import type { Agent } from '@/lib/types';
import { salesPartners } from '@/lib/data';

type Props = {
  children?: React.ReactNode;
  agent?: Agent;
};

const initialState: AgentFormState = {
    message: '',
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'ویرایش نماینده' : 'افزودن نماینده'}
        </Button>
    )
}


export function AgentFormDialog({ children, agent }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(addOrUpdateAgent, initialState);
  const { toast } = useToast();

  const isEdit = !!agent;

  useEffect(() => {
    if (state.message && !state.errors) {
        toast({
            title: isEdit ? 'نماینده ویرایش شد' : 'نماینده اضافه شد',
            description: state.message,
        });
        setIsOpen(false);
    } else if (state.message && state.errors) {
        toast({
            variant: 'destructive',
            title: 'خطا در فرم',
            description: 'لطفا خطاها را برطرف کرده و مجددا تلاش کنید.'
        })
    }
  }, [state, toast, isEdit]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <PlusCircle className="ml-2 h-4 w-4" />
            افزودن نماینده جدید
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? `ویرایش نماینده: ${agent.name}`: 'افزودن نماینده جدید'}</DialogTitle>
          <DialogDescription>
             {isEdit ? 'اطلاعات نماینده را ویرایش کنید.' : 'اطلاعات نماینده جدید را برای افزودن به سیستم وارد کنید.'}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} key={agent?.id || 'new'}>
            <input type="hidden" name="id" value={agent?.id} />
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">نام کامل</Label>
                        <Input id="name" name="name" placeholder="مثال: علی رضایی" defaultValue={agent?.name} required />
                        {state.errors?.name && <p className="text-xs text-red-500">{state.errors.name[0]}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="code">کد نماینده</Label>
                        <Input id="code" name="code" placeholder="مثال: N-001" defaultValue={agent?.code} required />
                        {state.errors?.code && <p className="text-xs text-red-500">{state.errors.code[0]}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">ایمیل</Label>
                        <Input id="email" name="email" type="email" placeholder="agent@example.com" defaultValue={agent?.contact.email} required dir="ltr"/>
                        {state.errors?.email && <p className="text-xs text-red-500">{state.errors.email[0]}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="phone">شماره تماس</Label>
                        <Input id="phone" name="phone" placeholder="09123456789" defaultValue={agent?.contact.phone} required dir="ltr"/>
                        {state.errors?.phone && <p className="text-xs text-red-500">{state.errors.phone[0]}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="telegramChatId">شناسه چت تلگرام (اختیاری)</Label>
                        <Input id="telegramChatId" name="telegramChatId" placeholder="123456789" defaultValue={agent?.contact.telegramChatId} dir="ltr" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="salesPartnerId">همکار فروش (اختیاری)</Label>
                        <Select name="salesPartnerId" defaultValue={agent?.salesPartnerId || 'none'}>
                            <SelectTrigger id="salesPartnerId">
                                <SelectValue placeholder="یک همکار فروش انتخاب کنید" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
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
                 <div className="space-y-2">
                    <Label htmlFor="commissionRate">درصد پورسانت نماینده</Label>
                    <Input id="commissionRate" name="commissionRate" type="number" placeholder="مثال: ۵" defaultValue={agent?.commissionRate} required dir="ltr" />
                    {state.errors?.commissionRate && <p className="text-xs text-red-500">{state.errors.commissionRate[0]}</p>}
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">انصراف</Button>
                </DialogClose>
                <SubmitButton isEdit={isEdit} />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
