
'use client';

import { useState } from 'react';
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { sendTestTelegramNotification } from './actions';


export default function SettingsPage() {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [messageTemplate, setMessageTemplate] = useState(
    "نماینده گرامی {{name}}، فاکتور جدید شما به مبلغ {{amount}} تومان در پورتال شما ثبت شد. لینک مشاهده: {{portalLink}}"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    setIsSaving(true);
    // In a real app, you'd save these to a database or a config file.
    // For now, we'll just show a toast message.
    console.log("Saving settings:", { botToken, chatId, messageTemplate });
    setTimeout(() => {
      toast({
        title: "تنظیمات ذخیره شد",
        description: "تغییرات شما با موفقیت ذخیره گردید.",
      });
      setIsSaving(false);
    }, 1000);
  };

  const handleTest = async () => {
    if (!botToken) {
        toast({
            variant: 'destructive',
            title: 'توکن ربات خالی است',
            description: 'لطفا توکن ربات تلگرام را برای ارسال پیام تستی وارد کنید.'
        });
        return;
    }
    setIsTesting(true);
    try {
      const result = await sendTestTelegramNotification({ botToken, chatId, messageTemplate });
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
    } catch (error) {
       toast({
          variant: 'destructive',
          title: "خطای غیرمنتظره",
          description: error instanceof Error ? error.message : 'یک خطای ناشناخته رخ داد.',
        });
    } finally {
        setIsTesting(false);
    }
  };


  return (
    <>
      <PageHeader title="تنظیمات" />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>نوتیفیکیشن تلگرام</CardTitle>
            <CardDescription>
              {"تنظیمات مربوط به ربات تلگرام برای ارسال نوتیفیکیشن‌ها به نمایندگان. میتوانید از متغیرهای {{name}}، {{amount}} و {{portalLink}} در قالب پیام استفاده کنید."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="bot-token">توکن ربات تلگرام</Label>
                <Input 
                  id="bot-token" 
                  placeholder="توکن ربات خود را وارد کنید" 
                  dir="ltr"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chat-id">شناسه چت پیش‌فرض (برای تست)</Label>
                <Input 
                  id="chat-id" 
                  placeholder="برای ارسال تست، شناسه چت خود را وارد کنید" 
                  dir="ltr"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message-template">قالب پیام</Label>
                <Textarea
                  id="message-template"
                  placeholder="مثال: نماینده گرامی {{name}}، فاکتور جدید شما به مبلغ {{amount}} تومان صادر شد."
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  rows={4}
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button 
                variant="secondary" 
                className="ml-auto" 
                onClick={handleTest} 
                disabled={isTesting || isSaving}
            >
              {isTesting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              ارسال نوتیفیکیشن تست
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isTesting}>
              {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              ذخیره تغییرات
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
