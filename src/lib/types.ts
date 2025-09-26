
export type Agent = {
  id: string;
  name: string;
  code: string; // As per ERD
  contact: {
    email: string;
    phone: string;
    telegramChatId?: string;
  };
  salesPartnerId: string | null;
  status: 'active' | 'inactive';
  totalSales: number;
  totalPayments: number;
  totalDebt: number; // As per ERD
  avatarUrl: string;
  portalLink: string;
  createdAt: string; // As per ERD
};

export type Invoice = {
  id: string;
  invoiceNumber: string; // As per ERD
  agentId: string;
  agentName: string;
  date: string; // issue_date in ERD
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue' | 'cancelled'; // Extended statuses
  items: {
    description: string;
    amount: number;
  }[];
};

export type Payment = {
  id: string;
  agentId: string;
  invoiceId: string;
  date: string; // payment_date
  amount: number;
  referenceNumber?: string; // As per ERD
};

export type SalesPartner = {
  id:string;
  name: string;
  commissionRate: number;
  totalSubAgentSales: number;
};
