// ... (imports)

// Mock table for Commission Reports on the primary database
let commissionReports: CommissionReport[] = [];
let commissionAdjustments: CommissionAdjustment[] = [];


export const CommissionService = {
  
  // ... (createClawbackAdjustment)

  /**
   * Item 3.4: Implements a state machine to lock finalized reports.
   * This is a WRITE operation on the primary database.
   */
  finalizeReport: async (reportId: string): Promise<{ success: boolean; message: string }> => {
    console.log(`[CommissionService] Finalizing report ${reportId}...`);
    const report = commissionReports.find(r => r.id === reportId);

    if (!report) {
      return { success: false, message: "Report not found." };
    }
    if (report.status !== 'DRAFT') {
      return { success: false, message: `Report is already in '${report.status}' state and cannot be finalized.` };
    }

    report.status = 'FINALIZED';
    console.log(`[CommissionService] Report ${reportId} is now FINALIZED and immutable.`);
    
    // Mark associated adjustments as applied
    // This should be part of the same transaction.
    commissionAdjustments.forEach(adj => {
        if (adj.appliedReportId === `temp_${reportId}`) {
            adj.appliedReportId = reportId;
        }
    });

    return { success: true, message: "Report finalized successfully." };
  },

  calculateCommission: async (
    // ... (parameters)
  ): Promise<CommissionReport> => {
    // ... (calculation logic)
    
    const reportId = `rep_${randomUUID()}`;

    // Mark adjustments with a temporary ID linking them to this calculation
    unappliedAdjustments.forEach(adj => adj.appliedReportId = `temp_${reportId}`);
    
    const newReport: CommissionReport = {
        id: reportId,
        ...reportData,
    };
    
    // Save the new DRAFT report to the primary DB
    commissionReports.push(newReport);
    
    return newReport;
  },

  // Example of another state transition
  payReport: async (reportId: string) => {
    const report = commissionReports.find(r => r.id === reportId);
    if (report && report.status === 'FINALIZED') {
        report.status = 'PAID';
        return { success: true };
    }
    return { success: false, message: 'Report must be in FINALIZED state to be paid.' };
  },

  // Mutations (like DELETE) must now check the state
  deleteReport: async (reportId: string) => {
    const report = commissionReports.find(r => r.id === reportId);
     if (report && report.status !== 'DRAFT') {
        console.error(`[CommissionService] Cannot delete report ${reportId} because it is in '${report.status}' state.`);
        return { success: false, message: 'Only DRAFT reports can be deleted.' };
     }
     // ... proceed with deletion
     return { success: true };
  }
};
