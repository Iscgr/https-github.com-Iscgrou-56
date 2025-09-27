import { randomUUID } from 'crypto';

import type {
  CommissionAdjustment,
  CommissionCalculationDetail,
  CommissionReport,
  Partner,
} from './types';

// Item 3.2/3.3 mock data stores while the real persistence layer matures
// In a production scenario these would be replaced with repository calls.
type CommissionReportWithDetails = CommissionReport & {
  calculationDetails: CommissionCalculationDetail[];
};

type CalculateCommissionResult = CommissionReportWithDetails;

type FinalizeResult = { success: boolean; message: string };

type PayResult = { success: boolean; message: string };

type DeleteResult = { success: boolean; message: string };

let commissionReports: CommissionReportWithDetails[] = [];
let commissionAdjustments: CommissionAdjustment[] = [];

const mockAdjustments: CommissionAdjustment[] = [
  {
    id: 'adj-001',
    agentId: 'agent_1',
    amount: 150_000,
    reason: 'Overpayment correction',
    createdAt: new Date('2023-11-01T08:45:00Z').toISOString(),
    appliedReportId: null,
    status: 'UNAPPLIED',
  },
  {
    id: 'adj-002',
    agentId: 'agent_2',
    amount: -50_000,
    reason: 'Support credit',
    createdAt: new Date('2023-11-11T09:30:00Z').toISOString(),
    appliedReportId: null,
    status: 'UNAPPLIED',
  },
];

commissionAdjustments = mockAdjustments;

function buildCommissionDetails(partnerId: string): CommissionCalculationDetail[] {
  // In lieu of real invoice aggregation we create deterministic mock rows.
  return [
    { invoiceId: `${partnerId}-invoice-001`, amount: 1_200_000, metadata: { source: 'SYSTEM' } },
    { invoiceId: `${partnerId}-invoice-002`, amount: 750_000, metadata: { source: 'BATCH_UPLOAD' } },
  ];
}

function nowIso() {
  return new Date().toISOString();
}

export const CommissionService = {
  async calculateCommission(partner: Partner, startDate: string, endDate: string): Promise<CalculateCommissionResult> {
    const calculationDetails = buildCommissionDetails(partner.id);
    const totalCommission = calculationDetails.reduce((sum, detail) => sum + detail.amount, 0);

    const report: CommissionReportWithDetails = {
      id: randomUUID(),
      agentId: partner.id,
      partnerId: partner.id,
      periodStart: startDate,
      periodEnd: endDate,
      startDate,
      endDate,
      totalCommission,
      status: 'DRAFT',
      calculationDetails,
      createdAt: nowIso(),
      finalizedAt: null,
    };

    commissionReports = [report, ...commissionReports.filter((existing) => existing.id !== report.id)];

    return report;
  },

  async finalizeReport(reportId: string): Promise<FinalizeResult> {
    const report = commissionReports.find((item) => item.id === reportId);

    if (!report) {
      return { success: false, message: 'Report not found.' };
    }

    if (report.status !== 'DRAFT') {
      return { success: false, message: `Report is already in '${report.status}' state and cannot be finalized.` };
    }

    report.status = 'FINALIZED';
    report.finalizedAt = nowIso();

    commissionAdjustments = commissionAdjustments.map((adjustment) => {
      if (adjustment.appliedReportId === `temp_${reportId}`) {
        return { ...adjustment, appliedReportId: reportId, status: 'APPLIED' };
      }
      return adjustment;
    });

    return { success: true, message: 'Report finalized successfully.' };
  },

  async payReport(reportId: string): Promise<PayResult> {
    const report = commissionReports.find((item) => item.id === reportId);
    if (!report) {
      return { success: false, message: 'Report not found.' };
    }

    if (report.status !== 'FINALIZED') {
      return { success: false, message: 'Report must be FINALIZED before payment.' };
    }

    report.status = 'PAID';
    return { success: true, message: 'Report marked as paid.' };
  },

  async deleteReport(reportId: string): Promise<DeleteResult> {
    const report = commissionReports.find((item) => item.id === reportId);

    if (!report) {
      return { success: false, message: 'Report not found.' };
    }

    if (report.status !== 'DRAFT') {
      return { success: false, message: 'Only DRAFT reports can be deleted.' };
    }

    commissionReports = commissionReports.filter((item) => item.id !== reportId);

    commissionAdjustments = commissionAdjustments.map((adjustment) =>
      adjustment.appliedReportId === reportId
        ? { ...adjustment, appliedReportId: null, status: 'UNAPPLIED' }
        : adjustment,
    );

    return { success: true, message: 'Report deleted successfully.' };
  },

  listReports(): CommissionReportWithDetails[] {
    return commissionReports;
  },

  listAdjustments(): CommissionAdjustment[] {
    return commissionAdjustments;
  },
};
