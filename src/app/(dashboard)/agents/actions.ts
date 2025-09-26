"use server";

import { updateAgentFinancialSummary, getAllAgentIds, rebuildAllSummaries } from "@/lib/data";
import { revalidatePath } from "next/cache";

// This action simulates creating or updating an agent and then
// triggering a background update for their financial summary.
export async function saveAgentAction(agentData: any) {
  // 1. Save agent data to the main table (write model)
  console.log("[Action] Saving agent data...", agentData);
  // ... (logic to save agent data would be here)

  // 2. Trigger the summary update (event simulation)
  // In a real app, this would be an event pushed to a queue.
  await updateAgentFinancialSummary(agentData.id);

  // 3. Revalidate the path to show changes in the UI
  revalidatePath("/agents");

  return { success: true, message: "Agent saved. Summary update is in progress." };
}


// --- NEW ACTION for Item 2.3: Discrepancy Reconciliation ---

/**
 * Admin tool to trigger a full rebuild of the AgentFinancialSummaries table.
 * This is a critical tool for ensuring data consistency in a CQRS system.
 */
export async function rebuildSummariesAction() {
    console.log("[Action] [Admin] Full rebuild of financial summaries triggered.");
    try {
        // In a real system, this would likely be a long-running background job.
        // The function in data.ts simulates this process.
        await rebuildAllSummaries();
        
        // After the rebuild is complete, revalidate the agents page
        // so users will see the fresh data.
        revalidatePath("/agents");
        
        return { success: true, message: "Successfully rebuilt all agent financial summaries." };

    } catch (error: any) {
        console.error("[Action] [Admin] Failed to rebuild summaries:", error);
        return { success: false, message: `Failed to rebuild summaries: ${error.message}` };
    }
}
