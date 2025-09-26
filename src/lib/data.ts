
import type { Agent, Invoice, SalesPartner, Payment } from './types';

export const agents: Agent[] = [
  {
    id: 'agent-1',
    name: 'نماینده یک',
    code: 'N-001',
    contact: { email: 'agent1@example.com', phone: '09123456781' },
    salesPartnerId: 'partner-1',
    status: 'active',
    totalSales: 22000000,
    totalPayments: 12000000,
    totalDebt: 10000000,
    avatarUrl: 'https://picsum.photos/seed/agent1/100/100',
    portalLink: '/portal/agent-1',
    publicId: 'pub-agent-1-xyz',
    createdAt: '2023-01-15T10:30:00Z',
  },
  {
    id: 'agent-2',
    name: 'نماینده دو',
    code: 'N-002',
    contact: { email: 'agent2@example.com', phone: '09123456782', telegramChatId: '123456789' },
    salesPartnerId: 'partner-1',
    status: 'active',
    totalSales: 25000000,
    totalPayments: 25000000,
    totalDebt: 0,
    avatarUrl: 'https://picsum.photos/seed/agent2/100/100',
    portalLink: '/portal/agent-2',
    publicId: 'pub-agent-2-abc',
    createdAt: '2023-02-20T11:00:00Z',
  },
  {
    id: 'agent-3',
    name: 'نماینده سه',
    code: 'N-003',
    contact: { email: 'agent3@example.com', phone: '09123456783' },
    salesPartnerId: 'partner-2',
    status: 'inactive',
    totalSales: 5000000,
    totalPayments: 5000000,
    totalDebt: 0,
    avatarUrl: 'https://picsum.photos/seed/agent3/100/100',
    portalLink: '/portal/agent-3',
    publicId: 'pub-agent-3-def',
    createdAt: '2023-03-01T18:00:00Z',
  },
];

export const invoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'MF-2023-0001',
    agentId: 'agent-1',
    agentName: 'نماینده یک',
    date: '2023-10-01',
    dueDate: '2023-10-15',
    amount: 10000000,
    status: 'unpaid',
    items: [{ description: 'مصرف ماهانه مهر', amount: 10000000 }],
  },
  {
    id: 'inv-2',
    invoiceNumber: 'MF-2023-0002',
    agentId: 'agent-1',
    agentName: 'نماینده یک',
    date: '2023-09-01',
    dueDate: '2023-09-15',
    amount: 5000000,
    status: 'paid',
    items: [{ description: 'مصرف ماهانه شهریور', amount: 5000000 }],
  },
  {
    id: 'inv-3',
    invoiceNumber: 'MF-2023-0003',
    agentId: 'agent-2',
    agentName: 'نماینده دو',
    date: '2023-10-05',
    dueDate: '2023-10-20',
    amount: 10000000,
    status: 'paid',
    items: [{ description: 'مصرف ماهانه مهر', amount: 10000000 }],
  },
  {
    id: 'inv-4',
    invoiceNumber: 'MF-2023-0004',
    agentId: 'agent-1',
    agentName: 'نماینده یک',
    date: '2023-08-01',
    dueDate: '2023-08-15',
    amount: 7000000,
    status: 'paid',
    items: [{ description: 'مصرف ماهانه مرداد', amount: 7000000 }],
  },
];

export const salesPartners: SalesPartner[] = [
  {
    id: 'partner-1',
    name: 'همکار فروش الف',
    commissionRate: 5,
    totalSubAgentSales: 47000000,
  },
  {
    id: 'partner-2',
    name: 'همکار فروش ب',
    commissionRate: 7,
    totalSubAgentSales: 5000000,
  },
];

export const payments: Payment[] = [
    { id: 'pay-1', agentId: 'agent-1', date: '2023-09-10', amount: 5000000, invoiceId: 'inv-2' },
    { id: 'pay-2', agentId: 'agent-2', date: '2023-10-10', amount: 10000000, invoiceId: 'inv-3' },
    { id: 'pay-3', agentId: 'agent-1', date: '2023-08-10', amount: 7000000, invoiceId: 'inv-4' },
];

export const getAgentById = (id: string) => agents.find(a => a.id === id || a.publicId === id);
export const getInvoicesByAgentId = (agentId: string) => invoices.filter(i => i.agentId === agentId);
export const getPaymentsByAgentId = (agentId: string) => payments.filter(p => p.agentId === agentId);
