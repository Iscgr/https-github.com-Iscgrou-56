"use server";

import { updateAgentFinancialSummary, rebuildAllSummaries } from "@/lib/data";
import { revalidatePath } from "next/cache";
import type { Agent } from "@/lib/types";
import { randomUUID } from "crypto";

// This action simulates creating or updating an agent and then
// triggering a background update for their financial summary.
type AgentUpsertPayload = Partial<Agent> & { id: string };

export type AgentFormState = { success: boolean; message: string };

const buildAgentPayload = (formData: FormData): AgentUpsertPayload => {
    const idValue = formData.get("id");
    const partnerIdValue = formData.get("partnerId");
    const nameValue = formData.get("name");

    const agentId = typeof idValue === "string" && idValue ? idValue : randomUUID();

    return {
        id: agentId,
        partnerId: typeof partnerIdValue === "string" ? partnerIdValue : undefined,
        name: typeof nameValue === "string" ? nameValue.trim() : undefined,
    };
};

export async function saveAgentAction(
    _prevState: AgentFormState,
    formData: FormData
): Promise<AgentFormState> {
    const agentData = buildAgentPayload(formData);

    if (!agentData.name || !agentData.name.length) {
        return { success: false, message: "نام نماینده الزامی است." };
    }

    // 1. Save agent data to the main table (write model)
    console.log("[Action] Saving agent data...", agentData);
    // ... (logic to save agent data would be here)

    try {
        // 2. Trigger the summary update (event simulation)
        // In a real app, this would be an event pushed to a queue.
        await updateAgentFinancialSummary(agentData.id);

        // 3. Revalidate the path to show changes in the UI
        revalidatePath("/agents");

        return { success: true, message: "اطلاعات نماینده ذخیره شد و خلاصه مالی در حال به‌روزرسانی است." };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        return { success: false, message: `ذخیره‌سازی نماینده با خطا مواجه شد: ${errorMessage}` };
    }
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

    } catch (error: unknown) {
        console.error("[Action] [Admin] Failed to rebuild summaries:", error);
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        return { success: false, message: `Failed to rebuild summaries: ${errorMessage}` };
    }
}
