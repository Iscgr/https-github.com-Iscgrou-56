import { PrismaClient } from '../src/generated/prisma';

import {
  AgentStatus,
  InvoiceStatus,
  InvoiceSource,
  PaymentMethod,
  WalletTransactionType,
} from '@/generated/prisma';
import { encryptSettingValue } from '../src/lib/security/secure-settings';

type SeedAgent = {
  id: string;
  code: string;
  name: string;
  partnerId: string;
  commissionRate: number;
  status: AgentStatus;
  email?: string;
  phone?: string;
  telegramChatId?: string;
  avatarUrl?: string;
};

type SeedInvoice = {
  id: string;
  agentId: string;
  invoiceNumber: string;
  amount: number;
  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  source?: InvoiceSource;
};

type SeedPayment = {
  id: string;
  agentId: string;
  amount: number;
  invoiceId?: string;
  method?: PaymentMethod;
  reference?: string;
  note?: string;
};

type SeedWallet = {
  id: string;
  agentId: string;
  balance: number;
  lastTransactionAt?: Date | null;
};

type SeedWalletTransaction = {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  referenceId?: string;
  notes?: string;
  createdAt: Date;
  invoiceId?: string;
  paymentId?: string;
};

const prisma = new PrismaClient();

const partnerId = 'partner_1';

const agents: SeedAgent[] = [
  {
    id: 'agent_1',
    code: 'AG-001',
    name: 'Agent One',
    partnerId,
    commissionRate: 0.1,
    status: AgentStatus.ACTIVE,
    email: 'agent.one@example.com',
    phone: '+98-901-111-1111',
    telegramChatId: '@agent_one',
  },
  {
    id: 'agent_2',
    code: 'AG-002',
    name: 'Agent Two',
    partnerId,
    commissionRate: 0.12,
    status: AgentStatus.ACTIVE,
    email: 'agent.two@example.com',
    phone: '+98-901-222-2222',
    telegramChatId: '@agent_two',
  },
];

const invoices: SeedInvoice[] = [
  {
    id: 'inv_001',
    agentId: 'agent_1',
    invoiceNumber: 'INV-2023-001',
    amount: 100,
    issueDate: new Date('2023-10-01T00:00:00Z'),
    dueDate: new Date('2023-10-15T00:00:00Z'),
    status: InvoiceStatus.UNPAID,
  },
  {
    id: 'inv_002',
    agentId: 'agent_1',
    invoiceNumber: 'INV-2023-002',
    amount: 250,
    issueDate: new Date('2023-10-05T00:00:00Z'),
    dueDate: new Date('2023-10-20T00:00:00Z'),
    status: InvoiceStatus.UNPAID,
  },
  {
    id: 'inv_003',
    agentId: 'agent_2',
    invoiceNumber: 'INV-2023-003',
    amount: 500,
    issueDate: new Date('2023-10-02T00:00:00Z'),
    dueDate: new Date('2023-10-16T00:00:00Z'),
    status: InvoiceStatus.PAID,
  },
];

const payments: SeedPayment[] = [
  {
    id: 'pay_001',
    agentId: 'agent_2',
    amount: 500,
    invoiceId: 'inv_003',
    method: PaymentMethod.EXTERNAL,
    reference: 'PAY-2023-001',
  },
];

const wallets: SeedWallet[] = [
  { id: 'wallet_1', agentId: 'agent_1', balance: 50 },
  {
    id: 'wallet_2',
    agentId: 'agent_2',
    balance: 1000,
    lastTransactionAt: new Date('2023-10-10T10:00:00Z'),
  },
];

const walletTransactions: SeedWalletTransaction[] = [
  {
    id: 'txn_001',
    walletId: 'wallet_2',
    type: WalletTransactionType.DEPOSIT,
    amount: 1500,
    createdAt: new Date('2023-10-01T09:00:00Z'),
    notes: 'Initial funding',
    referenceId: 'funding_ref_abc',
  },
  {
    id: 'txn_002',
    walletId: 'wallet_2',
    type: WalletTransactionType.SETTLEMENT,
    amount: 500,
    createdAt: new Date('2023-10-10T10:00:00Z'),
    notes: 'Settled invoice inv_003',
    referenceId: 'invoice_inv_003',
    invoiceId: 'inv_003',
    paymentId: 'pay_001',
  },
];

async function main() {
  await prisma.settingsAuditLog.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.invoiceStatusHistory.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.agentFinancialSummary.deleteMany();
  await prisma.commissionAdjustment.deleteMany();
  await prisma.commissionReport.deleteMany();
  await prisma.processedUsageHash.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.systemSetting.deleteMany();

  const partner = await prisma.partner.create({
    data: {
      id: partnerId,
      name: 'Partner Alpha',
    },
  });

  for (const agent of agents) {
    await prisma.agent.create({
      data: {
        ...agent,
        commissionRate: agent.commissionRate,
        partnerId: partner.id,
      },
    });
  }

  for (const invoice of invoices) {
    await prisma.invoice.create({
      data: {
        ...invoice,
        currency: 'IRR',
        source: invoice.source ?? InvoiceSource.SYSTEM,
      },
    });
  }

  for (const payment of payments) {
    await prisma.payment.create({
      data: {
        ...payment,
        method: payment.method ?? PaymentMethod.EXTERNAL,
      },
    });
  }

  for (const wallet of wallets) {
    await prisma.wallet.create({
      data: {
        ...wallet,
        currency: 'IRR',
      },
    });
  }

  for (const wTxn of walletTransactions) {
    await prisma.walletTransaction.create({
      data: wTxn,
    });
  }

  for (const invoice of invoices) {
    await prisma.invoiceStatusHistory.create({
      data: {
        id: `${invoice.id}_hist_1`,
        invoiceId: invoice.id,
        fromStatus: InvoiceStatus.DRAFT,
        toStatus: invoice.status,
        actorUserId: 'system:seed',
        notes: 'Seeded status',
      },
    });
  }

  for (const agent of agents) {
    await prisma.agentFinancialSummary.create({
      data: {
        agentId: agent.id,
        totalBilled: invoices
          .filter((inv) => inv.agentId === agent.id)
          .reduce((sum, inv) => sum + inv.amount, 0),
        totalPaid: payments
          .filter((pay) => pay.agentId === agent.id)
          .reduce((sum, pay) => sum + pay.amount, 0),
        outstandingAmount: invoices
          .filter((inv) => inv.agentId === agent.id)
          .filter((inv) => inv.status !== InvoiceStatus.PAID)
          .reduce((sum, inv) => sum + inv.amount, 0),
        draftCount: 0,
        unpaidCount: invoices.filter(
          (inv) => inv.agentId === agent.id && inv.status === InvoiceStatus.UNPAID,
        ).length,
        overdueCount: invoices.filter(
          (inv) => inv.agentId === agent.id && inv.status === InvoiceStatus.OVERDUE,
        ).length,
        paidCount: invoices.filter(
          (inv) => inv.agentId === agent.id && inv.status === InvoiceStatus.PAID,
        ).length,
      },
    });
  }

  await prisma.systemSetting.create({
    data: {
      key: 'notifications.email.from',
      value: 'noreply@example.com',
      description: 'Sender email for transactional notifications',
      updatedBy: 'system:seed',
      isSensitive: false,
    },
  });

  await prisma.systemSetting.create({
    data: {
      key: 'payments.gateway.secret',
      value: encryptSettingValue('demo-secret'),
      description: 'Demo gateway secret for local testing',
      updatedBy: 'system:seed',
      isSensitive: true,
    },
  });

  console.log('Seed data inserted successfully.');
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
