import { placeholderImages } from './placeholder-images';
import { Agent, Invoice, Partner, Payment } from './types';

// Simulate a database fetch
export const agents: Agent[] = [
  { id: '1', name: 'John Doe', commissionRate: 10, balance: 1000, portalLink: 'https://example.com/portal/1' },
  { id: '2', name: 'Jane Smith', commissionRate: 12, balance: 1500, portalLink: 'https://example.com/portal/2' },
];

export const invoices: Invoice[] = [];
export const payments: Payment[] = [];
export const salesPartners: Partner[] = [];

export async function getAgents(): Promise<Agent[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(agents);
    }, 500);
  });
}

export async function getAgent(id: string): Promise<Agent | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(agents.find(agent => agent.id === id));
    }, 500);
  });
}

export async function getInvoices(): Promise<Invoice[]> {
  // Simulate fetching invoices
  return [];
}

export async function getPartners(): Promise<Partner[]> {
  // Simulate fetching partners
  return [];
}

export async function getPayments(): Promise<Payment[]> {
  // Simulate fetching payments
  return [];
}

export async function getPortalData() {
  return {
    totalCustomers: Math.floor(Math.random() * 50) + 10,
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
}
