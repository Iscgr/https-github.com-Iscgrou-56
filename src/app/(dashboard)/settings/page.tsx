import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="تنظیمات" />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>نوتیفیکیشن تلگرام</CardTitle>
            <CardDescription>
              تنظیمات مربوط به ربات تلگرام برای ارسال نوتیفیکیشن‌ها به نمایندگان.
              میتوانید از متغیرهای {{name}}، {{amount}} و {{portalLink}} در قالب پیام استفاده کنید.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bot-token">توکن ربات تلگرام</Label>
                <Input id="bot-token" placeholder="توکن ربات خود را وارد کنید" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chat-id">شناسه چت پیش‌فرض (اختیاری)</Label>
                <Input id="chat-id" placeholder="در صورت خالی بودن، برای هر نماینده جداگانه ارسال میشود" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message-template">قالب پیام</Label>
                <Textarea
                  id="message-template"
                  placeholder="مثال: نماینده گرامی {{name}}، فاکتور جدید شما به مبلغ {{amount}} تومان صادر شد."
                  defaultValue="نماینده گرامی {{name}}، فاکتور جدید شما به مبلغ {{amount}} تومان در پورتال شما ثبت شد. لینک مشاهده: {{portalLink}}"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <div className="flex-1" />
            <Button>ذخیره تغییرات</Button>
            <Button variant="secondary" className="mr-2">ارسال نوتیفیکیشن تست</Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
