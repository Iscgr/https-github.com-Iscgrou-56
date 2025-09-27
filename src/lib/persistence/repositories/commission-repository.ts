import { randomUUID } from 'crypto';

import type { Prisma } from '@/generated/prisma';

import { BaseRepository } from './base';

export class CommissionRepository extends BaseRepository {
  async findById(id: string) {
    return this.db.commissionReport.findUnique({
      where: { id },
      include: {
        adjustments: true,
      },
    });
  }

  async createDraft(data: Prisma.CommissionReportUncheckedCreateInput) {
    const report = await this.db.commissionReport.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
      },
    });

    await this.writeAuditLog({
      entityType: 'CommissionReport',
      entityId: report.id,
      action: 'COMMISSION_DRAFT_CREATED',
      payload: data as Record<string, unknown>,
    });

    return report;
  }

  async finalizeReport(reportId: string) {
    const report = await this.db.commissionReport.update({
      where: { id: reportId },
      data: {
        status: 'FINALIZED',
        finalizedAt: new Date(),
      },
    });

    await this.writeAuditLog({
      entityType: 'CommissionReport',
      entityId: reportId,
      action: 'COMMISSION_FINALIZED',
      payload: {},
    });

    return report;
  }

  async markPaid(reportId: string) {
    const report = await this.db.commissionReport.update({
      where: { id: reportId },
      data: {
        status: 'PAID',
      },
    });

    await this.writeAuditLog({
      entityType: 'CommissionReport',
      entityId: reportId,
      action: 'COMMISSION_PAID',
      payload: {},
    });

    return report;
  }

  async listAdjustments(agentId: string, status: string) {
    return this.db.commissionAdjustment.findMany({
      where: {
        agentId,
        status,
      },
    });
  }

  async applyAdjustments(reportId: string, adjustmentIds: string[]) {
    if (!adjustmentIds.length) return;
    await this.db.commissionAdjustment.updateMany({
      where: {
        id: {
          in: adjustmentIds,
        },
      },
      data: {
        appliedReportId: reportId,
        status: 'APPLIED',
      },
    });
  }

  async relinkTemporaryAdjustments(tempId: string, reportId: string) {
    await this.db.commissionAdjustment.updateMany({
      where: { appliedReportId: tempId },
      data: {
        appliedReportId: reportId,
        status: 'APPLIED',
      },
    });
  }
}
