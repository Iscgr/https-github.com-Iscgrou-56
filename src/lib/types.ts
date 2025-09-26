export type Agent = {
  id: string;
  name: string;
  contact: {
    email: string;
    phone: string;
  };
  salesPartnerId: string | null;
  status: 'active' | 'inactive';
  totalSales: number;
  totalPayments: number;
  avatarUrl: string;
  portalLink: string;
};

export type Invoice = {
  id: string;
  agentId: string;
  agentName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  items: {
    description: string;
    amount: number;
  }[];
};

export type Payment = {
  id: string;
  agentId: string;
  date: string;
  amount: number;
  invoiceId: string;
};

export type SalesPartner = {
  id: string;
  name: string;
  commissionRate: number;
  totalSubAgentSales: number;
};
