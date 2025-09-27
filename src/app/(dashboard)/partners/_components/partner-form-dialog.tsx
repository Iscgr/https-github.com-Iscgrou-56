
'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { addOrUpdatePartner } from '../actions';
import { type PartnerFormState } from '../types';
import type { SalesPartner } from '@/lib/types';

type Props = {
  children?: React.ReactNode;
  partner?: SalesPartner;
};

const initialState: PartnerFormState = {
    message: '',
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'ویرایش همکار' : 'افزودن همکار'}
        </Button>
    )
}


export function PartnerFormDialog({ children, partner }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useFormState(addOrUpdatePartner, initialState);
  const { toast } = useToast();
  const isEditing = !!partner;

  useEffect(() => {
    if (state.message && !state.errors) {
        toast({
            title: isEditing ? 'همکار ویرایش شد' : 'همکار اضافه شد',
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
  }, [state, toast, isEditing]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children ?? <Button>افزودن همکار جدید</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{partner ? 'ویرایش همکار فروش' : 'افزودن همکار فروش جدید'}</DialogTitle>
          <DialogDescription>
            اطلاعات همکار فروش را وارد کنید.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} key={partner?.id || 'new'}>
            {partner && <input type="hidden" name="id" value={partner.id} />}
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">نام کامل همکار</Label>
                    <Input id="name" name="name" placeholder="مثال: شرکت توسعه الف" required defaultValue={partner?.name} />
                    {state.errors?.name && <p className="text-xs text-red-500">{state.errors.name[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="commissionRate">نرخ کمیسیون (٪)</Label>
                    <Input id="commissionRate" name="commissionRate" type="number" placeholder="مثال: 5" required dir="ltr" defaultValue={partner?.commissionRate} />
                    {state.errors?.commissionRate && <p className="text-xs text-red-500">{state.errors.commissionRate[0]}</p>}
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">انصراف</Button>
                </DialogClose>
                <SubmitButton isEditing={isEditing} />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
