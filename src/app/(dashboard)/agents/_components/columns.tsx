"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AgentFinancialSummary } from "@/lib/types"
import { MoreHorizontal } from "lucide-react"
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
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export const columns: ColumnDef<AgentFinancialSummary>[] = [
  {
    accessorKey: "agentName",
    header: "نام نماینده",
    cell: ({ row }) => (
      <Link href={`/agents/${row.original.agentId}`} className="hover:underline text-cyan-400">
        {row.getValue("agentName")}
      </Link>
    )
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
      const isActive = status === 'active'
      return (
        <Badge variant={isActive ? "default" : "destructive"} className={isActive ? "bg-green-600" : ""}>
          {isActive ? 'فعال' : 'غیرفعال'}
        </Badge>
      )
    }
  },
  {
    accessorKey: "totalSales",
    header: "فروش کل",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalSales"))
      return <div className="text-right font-medium">{new Intl.NumberFormat("fa-IR").format(amount)}</div>
    }
  },
  {
    accessorKey: "totalDebt",
    header: "بدهی کل",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalDebt"))
      return <div className="text-right font-medium text-red-400">{new Intl.NumberFormat("fa-IR").format(amount)}</div>
    }
  },
  {
    accessorKey: "lastUpdatedAt",
    header: "آخرین بروزرسانی",
    cell: ({ row }) => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="text-xs text-gray-500">{new Date(row.getValue("lastUpdatedAt")).toLocaleTimeString('fa-IR')}</div>
          </TooltipTrigger>
          <TooltipContent><p>آخرین زمان همگام سازی داده ها</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const agent = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 text-white border-gray-700">
            <DropdownMenuLabel>عملیات</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/agents/${agent.agentId}`}>مشاهده پروفایل</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
