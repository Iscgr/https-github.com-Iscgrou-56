
import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTelegramSettings } from '@/lib/settings';
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const settings = await getTelegramSettings();

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
            <SettingsForm settings={settings} />
        </Card>
      </div>
    </>
  );
}
