import type { Prisma } from '@/generated/prisma';

import { BaseRepository } from './base';

export type AgentSummaryDTO = {
  agentId: string;
  agentName: string;
  agentCode: string;
  agentStatus: 'active' | 'inactive' | 'suspended';
  totalSales: number;
  totalPaid: number;
  totalDebt: number;
  draftCount: number;
  unpaidCount: number;
  overdueCount: number;
  paidCount: number;
  lastUpdatedAt: string;
};

export type AgentProfileDTO = Prisma.AgentGetPayload<{
  include: {
    PortalAppearance: true;
    partner: true;
    wallet: true;
  };
}>;

export class AgentRepository extends BaseRepository {
  async listAgents() {
    return this.db.agent.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async listAgentIds() {
    const records = await this.db.agent.findMany({
      select: { id: true },
    });
    return records.map((record) => record.id);
  }

  async findById(id: string): Promise<AgentProfileDTO | null> {
    return this.db.agent.findUnique({
      where: { id },
      include: {
        partner: true,
        wallet: true,
        PortalAppearance: true,
      },
    });
  }

  async findByCode(code: string) {
    return this.db.agent.findUnique({
      where: { code },
    });
  }

  async listFinancialSummaries(): Promise<AgentSummaryDTO[]> {
    const summaries = await this.db.agentFinancialSummary.findMany({
      include: {
        agent: true,
      },
      orderBy: {
        agent: {
          name: 'asc',
        },
      },
    });

    return summaries.map((summary) => ({
      agentId: summary.agentId,
      agentName: summary.agent.name,
      agentCode: summary.agent.code,
      agentStatus: summary.agent.status.toLowerCase() as AgentSummaryDTO['agentStatus'],
      totalSales: Number(summary.totalBilled),
      totalPaid: Number(summary.totalPaid),
      totalDebt: Number(summary.outstandingAmount),
      draftCount: summary.draftCount,
      unpaidCount: summary.unpaidCount,
      overdueCount: summary.overdueCount,
      paidCount: summary.paidCount,
      lastUpdatedAt: summary.lastCalculatedAt.toISOString(),
    }));
  }

  async createAgent(data: Prisma.AgentUncheckedCreateInput) {
    const agent = await this.db.agent.create({ data });
    await this.writeAuditLog({
      entityType: 'Agent',
      entityId: agent.id,
      action: 'AGENT_CREATED',
      payload: data,
    });
    return agent;
  }

  async updateAgent(id: string, data: Prisma.AgentUpdateInput) {
    const agent = await this.db.agent.update({ where: { id }, data });
    await this.writeAuditLog({
      entityType: 'Agent',
      entityId: id,
      action: 'AGENT_UPDATED',
      payload: data as Record<string, unknown>,
    });
    return agent;
  }
}
