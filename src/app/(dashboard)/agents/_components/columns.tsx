"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AgentFinancialSummary } from "@/lib/types" 
import { MoreHorizontal, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// --- CHANGE START for Item 2.5: Eventual Consistency Indicator ---
const isDataStale = (lastUpdate: string): boolean => {
    const lastUpdateDate = new Date(lastUpdate);
    const now = new Date();
    // Mark as stale if updated more than 1 minute ago (for demo purposes)
    return (now.getTime() - lastUpdateDate.getTime()) > 60 * 1000; 
}
// --- CHANGE END ---


export const columns: ColumnDef<AgentFinancialSummary>[] = [
  {
    accessorKey: "agentName",
    header: "نام نماینده",
    cell: ({ row }) => {
        const agentId = row.original.agentId
        const isStale = isDataStale(row.original.lastUpdatedAt);

        return (
            <div className={cn("flex items-center", { "animate-pulse": isStale })}>
                 <Link href={`/agents/${agentId}`} className="hover:underline text-cyan-400">{row.getValue("agentName")}</Link>
            </div>
        )
    }
  },
  {
    accessorKey: "agentCode",
    header: "کد نماینده",
  },
  {
    accessorKey: "agentStatus",
    header: "وضعیت",
    cell: ({ row }) => {
        const status = row.getValue("agentStatus")
        const variant = status === 'active' ? 'default' : 'destructive'
        const text = status === 'active' ? 'فعال' : 'غیرفعال'
        return <Badge variant={variant} className="bg-green-600 text-white">{text}</Badge>
    }
  },
  {
    accessorKey: "totalSales",
    header: "فروش کل",
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue("totalSales"))
        const formatted = new Intl.NumberFormat("fa-IR", { style: "currency", currency: "IRR" }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
  },
  {
    accessorKey: "totalDebt",
    header: "بدهی کل",
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue("totalDebt"))
        const formatted = new Intl.NumberFormat("fa-IR", { style: "currency", currency: "IRR" }).format(amount)
        return <div className="text-right font-medium text-red-400">{formatted}</div>
      },
  },
    {
    accessorKey: "lastUpdatedAt",
    header: "آخرین بروزرسانی",
    cell: ({ row }) => {
        const lastUpdate = new Date(row.getValue("lastUpdatedAt"));
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                         <div className="text-xs text-gray-500">{lastUpdate.toLocaleTimeString('fa-IR')}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>آخرین زمان همگام سازی داده ها</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      // ... (actions dropdown remains the same)
    },
  },
]
