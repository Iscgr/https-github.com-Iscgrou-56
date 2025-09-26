
import type { Agent, Invoice, SalesPartner, Payment } from './types';

export const agents: Agent[] = [
  {
    id: 'agent-1',
    name: 'نماینده یک',
    contact: { email: 'agent1@example.com', phone: '09123456781' },
    salesPartnerId: 'partner-1',
    status: 'active',
    totalSales: 15000000,
    totalPayments: 12000000,
    avatarUrl: 'https://picsum.photos/seed/agent1/100/100',
    portalLink: '/portal/agent-1',
  },
  {
    id: 'agent-2',
    name: 'نماینده دو',
    contact: { email: 'agent2@example.com', phone: '09123456782', telegramChatId: '123456789' }, // Example specific chat ID
    salesPartnerId: 'partner-1',
    status: 'active',
    totalSales: 25000000,
    totalPayments: 25000000,
    avatarUrl: 'https://picsum.photos/seed/agent2/100/100',
    portalLink: '/portal/agent-2',
  },
  {
    id: 'agent-3',
    name: 'نماینده سه',
    contact: { email: 'agent3@example.com', phone: '09123456783' },
    salesPartnerId: 'partner-2',
    status: 'inactive',
    totalSales: 5000000,
    totalPayments: 5000000,
    avatarUrl: 'https://picsum.photos/seed/agent3/100/100',
    portalLink: '/portal/agent-3',
  },
];

export const invoices: Invoice[] = [
  {
    id: 'inv-001',
    agentId: 'agent-1',
    agentName: 'نماینده یک',
    date: '2023-10-01',
    dueDate: '2023-10-15',
    amount: 3000000,
    status: 'unpaid',
    items: [{ description: 'مصرف ماهانه', amount: 3000000 }],
  },
  {
    id: 'inv-002',
    agentId: 'agent-1',
    agentName: 'نماینده یک',
    date: '2023-09-01',
    dueDate: '2023-09-15',
    amount: 5000000,
    status: 'paid',
    items: [{ description: 'مصرف ماهانه', amount: 5000000 }],
  },
  {
    id: 'inv-003',
    agentId: 'agent-2',
    agentName: 'نماینده دو',
    date: '2023-10-05',
    dueDate: '2023-10-20',
    amount: 10000000,
    status: 'paid',
    items: [{ description: 'مصرف ماهانه', amount: 10000000 }],
  },
  {
    id: 'inv-004',
    agentId: 'agent-1',
    agentName: 'نماینده یک',
    date: '2023-08-01',
    dueDate: '2023-08-15',
    amount: 7000000,
    status: 'overdue',
    items: [{ description: 'مصرف ماهانه', amount: 7000000 }],
  },
];

export const salesPartners: SalesPartner[] = [
  {
    id: 'partner-1',
    name: 'همکار فروش الف',
    commissionRate: 5,
    totalSubAgentSales: 40000000,
  },
  {
    id: 'partner-2',
    name: 'همکار فروش ب',
    commissionRate: 7,
    totalSubAgentSales: 5000000,
  },
];

export const payments: Payment[] = [
    { id: 'pay-1', agentId: 'agent-1', date: '2023-09-10', amount: 5000000, invoiceId: 'inv-002' },
    { id: 'pay-2', agentId: 'agent-2', date: '2023-10-10', amount: 10000000, invoiceId: 'inv-003' },
];

export const getAgentById = (id: string) => agents.find(a => a.id === id);
export const getInvoicesByAgentId = (agentId: string) => invoices.filter(i => i.agentId === agentId);
export const getPaymentsByAgentId = (agentId: string) => payments.filter(p => p.agentId === agentId);

