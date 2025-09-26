import { PageHeader } from '@/components/page-header';
import { PartnersClientPage } from './_components/partners-client-page';
import { getSalesPartners } from '@/lib/data';

export default async function PartnersPage() {
  const partners = await getSalesPartners();
  
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="مدیریت همکاران فروش (سرشاخه‌ها)"
        description="در این بخش می‌توانید گزارش‌های پورسانت را محاسبه و مدیریت کنید."
      />
      <PartnersClientPage partners={partners} />
    </div>
  );
}
