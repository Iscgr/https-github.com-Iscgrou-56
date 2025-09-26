
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { sendTestTelegramNotification, saveTelegramSettings } from './actions';
import { getTelegramSettings } from '@/lib/settings';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [messageTemplate, setMessageTemplate] = useState(
    "نماینده گرامی {{name}}، فاکتور جدید شما به مبلغ {{amount}} تومان در پورتال شما ثبت شد. لینک مشاهده: {{portalLink}}"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const settings = await getTelegramSettings();
        // Bot token is sensitive, we don't load it back into the UI for editing
        // The placeholder will indicate it's set on the server
        if (settings.botToken) {
          setBotToken(''); // Clear it, but we can show a placeholder
        }
        setChatId(settings.chatId || '');
        setMessageTemplate(settings.messageTemplate || 'نماینده گرامی {{name}}، فاکتور جدید شما به مبلغ {{amount}} تومان در پورتال شما ثبت شد. لینک مشاهده: {{portalLink}}');
      } catch (error) {
        // This might happen if the file doesn't exist yet, which is fine
        console.log("Could not load initial settings, starting fresh.");
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const result = await saveTelegramSettings({ botToken, chatId, messageTemplate });
         if (result.success) {
            toast({
                title: "تنظیمات ذخیره شد",
                description: result.message,
            });
            setBotToken(''); // Clear the input after successful save
        } else {
            toast({
                variant: 'destructive',
                title: "خطا در ذخیره سازی",
                description: result.message,
            });
        }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'خطای غیرمنتظره',
            description: error instanceof Error ? error.message : 'یک خطای ناشناخته رخ داد.',
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      // The action now gets the bot token from the server-side
      const result = await sendTestTelegramNotification({ chatId, messageTemplate });
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

  if (isLoading) {
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
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4 justify-end gap-2">
                         <Skeleton className="h-10 w-40" />
                         <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
            </div>
        </>
    )
  }


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
                  placeholder="در صورت نیاز به تغییر، توکن جدید را وارد کنید" 
                  dir="ltr"
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                />
                 <p className="text-xs text-muted-foreground">
                  توکن فقط در سمت سرور ذخیره می‌شود و برای ویرایش مجدد نمایش داده نخواهد شد.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="chat-id">شناسه چت پیش‌فرض (برای تست و نوتیفیکیشن)</Label>
                <Input 
                  id="chat-id" 
                  placeholder="شناسه چت پیش‌فرض را وارد کنید" 
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
