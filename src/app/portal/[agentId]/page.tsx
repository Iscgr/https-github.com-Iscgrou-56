
import { notFound } from 'next/navigation';
import { agents } from '@/lib/data';
import PortalClientPage from './_components/portal-client-page';
import { placeholderImages } from '@/lib/placeholder-images';

// This is a server component, so we can fetch data here.
export default function AgentPortalPage({
  params,
}: {
  params: { agentId: string };
}) {
  const { agentId } = params;
  const agent = agents.find(a => a.id === agentId || a.publicId === agentId);

  if (!agent) {
    notFound();
  }

  // In a real app, this data would come from your database.
  // For now, we'll generate some placeholder data.
  const portalData = {
    totalCustomers: Math.floor(Math.random() * 50) + 10, // Random number between 10 and 60
    whyUs: [
      {
        title: 'پشتیبانی ۲۴/۷',
        description: 'تیم پشتیبانی ما همیشه آماده پاسخگویی به سوالات و حل مشکلات شماست.',
        icon: 'ShieldCheck',
      },
      {
        title: 'قیمت‌های رقابتی',
        description: 'ما بهترین قیمت‌ها را برای با کیفیت‌ترین خدمات ارائه می‌دهیم.',
        icon: 'BadgePercent',
      },
      {
        title: 'راهکارهای نوآورانه',
        description: 'با استفاده از جدیدترین تکنولوژی‌ها، به شما در رسیدن به اهدافتان کمک می‌کنیم.',
        icon: 'Rocket',
      },
    ],
    clients: placeholderImages.slice(0, 12).map(img => ({
      name: `مشتری ${img.id}`,
      logoUrl: img.url,
    })),
  };

  return (
    <PortalClientPage
      agent={agent}
      portalData={portalData}
    />
  );
}
