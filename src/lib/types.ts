
export type Agent = {
  id: string;
  name: string;
  code: string;
  contact: {
    email: string;
    phone: string;
    telegramChatId?: string;
  };
  salesPartnerId: string | null;
  status: 'active' | 'inactive';
  totalSales: number;
  totalPayments: number;
  totalDebt: number;
  avatarUrl: string;
  portalLink: string;
  publicId: string;
  createdAt: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  agentId: string;
  agentName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue' | 'cancelled';
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
  referenceNumber?: string;
};

export type SalesPartner = {
  id:string;
  name: string;
  commissionRate: number;
  totalSubAgentSales: number;
};
