"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { ExternalLink, MoreHorizontal, User } from "lucide-react"

import type { AgentStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type AgentSummaryRow = {
  agentId: string
  agentName: string
  agentCode: string
  agentStatus: AgentStatus
  totalBilled: number
  totalPaid: number
  outstandingAmount: number
  lastCalculatedAt: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(value)) + " ریال"

export const columns: ColumnDef<AgentSummaryRow>[] = [
  {
    accessorKey: "agentName",
    header: "نام نماینده",
    cell: ({ row }) => (
      <Link href={`/agents/${row.original.agentId}`} className="hover:underline text-cyan-400">
        {row.getValue("agentName")}
      </Link>
    ),
  },
  {
    accessorKey: "agentCode",
    header: "کد نماینده",
  },
  {
    accessorKey: "agentStatus",
    header: "وضعیت",
    cell: ({ row }) => {
      const status = row.getValue("agentStatus") as AgentStatus
      const isActive = status === "ACTIVE"
      const isSuspended = status === "SUSPENDED"
      return (
        <Badge
          variant={isActive ? "default" : isSuspended ? "secondary" : "destructive"}
          className={
            isActive ? "bg-green-600" : isSuspended ? "bg-yellow-500 text-black" : "bg-red-600"
          }
        >
          {isActive ? "فعال" : isSuspended ? "معلق" : "غیرفعال"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "totalBilled",
    header: "صورت‌حساب کل",
    cell: ({ row }) => {
      const amount = row.getValue("totalBilled") as number
      return <div className="text-right font-medium">{formatCurrency(amount)}</div>
    },
  },
  {
    accessorKey: "totalPaid",
    header: "پرداختی کل",
    cell: ({ row }) => {
      const amount = row.getValue("totalPaid") as number
      return (
        <div className="text-right font-medium text-green-400">
          {formatCurrency(amount)}
        </div>
      )
    },
  },
  {
    accessorKey: "outstandingAmount",
    header: "بدهی باقی‌مانده",
    cell: ({ row }) => {
      const amount = row.getValue("outstandingAmount") as number
      return (
        <div className="text-right font-medium text-red-400">
          {formatCurrency(amount)}
        </div>
      )
    },
  },
  {
    accessorKey: "lastCalculatedAt",
    header: "آخرین بروزرسانی",
    cell: ({ row }) => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="text-xs text-gray-400">
              {new Date(row.getValue("lastCalculatedAt") as string).toLocaleDateString("fa-IR")}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>آخرین زمان محاسبه خلاصه مالی</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
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
            <Link href={`/agents/${row.original.agentId}`} className="flex items-center gap-2">
              <User size={14} />
              <span>مشاهده پروفایل</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem asChild>
            <Link 
              href={`/portal/${row.original.agentId}`} 
              target="_blank"
              className="flex items-center gap-2"
            >
              <ExternalLink size={14} />
              <span>مشاهده پرتال عمومی</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]
