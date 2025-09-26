
'use client';

import { useActionState, useTransition, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { saveTelegramSettingsAction, sendTestTelegramNotificationAction, type SettingsFormState } from '../actions';
import type { TelegramSettings } from '@/lib/settings';

const initialState: SettingsFormState = {
    message: '',
    success: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            ذخیره تغییرات
        </Button>
    )
}

export function SettingsForm({ settings }: { settings: TelegramSettings }) {
    const [state, formAction] = useActionState(saveTelegramSettingsAction, initialState);
    const [isTesting, startTestTransition] = useTransition();
    const [testChatId, setTestChatId] = useState(settings.chatId || '');
    const { toast } = useToast();

    if (state.success && state.message) {
        toast({
            title: "تنظیمات ذخیره شد",
            description: state.message,
        });
        state.message = ''; // prevent toast from showing on every render
    } else if (!state.success && state.message) {
        toast({
            variant: 'destructive',
            title: "خطا در ذخیره سازی",
            description: state.message,
        });
         state.message = '';
    }

    const handleTest = () => {
        startTestTransition(async () => {
            const result = await sendTestTelegramNotificationAction(testChatId);
             if (result.success) {
                toast({
                title: "نوتیفیکیشن تست ارسال شد",
                description: "لطفا تلگرام خود را برای دریافت پیام بررسی کنید.",
                });
            } else {
                toast({
                variant: 'destructive',
                title: "خطا در ارسال نوتیفیکیشن",
                description: result.message || 'یک خطای ناشناخته رخ داد.',
                });
            }
        })
    }
    
    return (
        <form action={formAction}>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="bot-token">توکن ربات تلگرام</Label>
                    <Input
                        id="bot-token"
                        name="botToken"
                        placeholder="در صورت نیاز به تغییر، توکن جدید را وارد کنید"
                        dir="ltr"
                        type="password"
                    />
                    <p className="text-xs text-muted-foreground">
                        توکن فقط در سمت سرور ذخیره می‌شود و برای ویرایش مجدد نمایش داده نخواهد شد.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="chat-id">شناسه چت پیش‌فرض (برای تست و نوتیفیکیشن)</Label>
                    <Input
                        id="chat-id"
                        name="chatId"
                        placeholder="شناسه چت پیش‌فرض را وارد کنید"
                        dir="ltr"
                        defaultValue={settings.chatId}
                        onChange={(e) => setTestChatId(e.target.value)}
                    />
                     {state.errors?.chatId && <p className="text-xs text-red-500">{state.errors.chatId[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="message-template">قالب پیام</Label>
                    <Textarea
                        id="message-template"
                        name="messageTemplate"
                        placeholder="مثال: نماینده گرامی {{name}}، فاکتور جدید شما به مبلغ {{amount}} تومان صادر شد."
                        defaultValue={settings.messageTemplate}
                        rows={4}
                    />
                    {state.errors?.messageTemplate && <p className="text-xs text-red-500">{state.errors.messageTemplate[0]}</p>}
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 justify-end gap-2">
                 <Button
                    type="button"
                    variant="secondary"
                    onClick={handleTest}
                    disabled={isTesting || !testChatId}
                >
                    {isTesting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    ارسال تست به شناسه چت
                </Button>
                <SubmitButton />
            </CardFooter>
        </form>
    )
}
