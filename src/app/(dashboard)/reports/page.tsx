
'use client';

import { useState } from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { agents as initialAgents } from "@/lib/data";
import type { Agent } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

function SalesByAgentReport() {
    const [agents, setAgents] = useState<Agent[]>(initialAgents);

    // In a real app, we might have filters for date ranges, etc.
    // For now, we just display the lifetime data we have.

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>گزارش فروش به تفکیک نماینده</CardTitle>
                        <CardDescription>نمایش مجموع فروش، پرداخت و بدهی برای هر نماینده.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                        <Download className="ml-2 h-4 w-4" />
                        خروجی اکسل
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>نماینده</TableHead>
                            <TableHead>کد</TableHead>
                            <TableHead>مجموع فروش</TableHead>
                            <TableHead>مجموع پرداخت</TableHead>
                            <TableHead>بدهی فعلی</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agents.map(agent => (
                            <TableRow key={agent.id}>
                                <TableCell className="font-medium">{agent.name}</TableCell>
                                <TableCell className="font-code">{agent.code}</TableCell>
                                <TableCell className="font-code">{new Intl.NumberFormat('fa-IR').format(agent.totalSales)} تومان</TableCell>
                                <TableCell className="font-code text-green-400">{new Intl.NumberFormat('fa-IR').format(agent.totalPayments)} تومان</TableCell>
                                <TableCell className="font-code text-red-400">{new Intl.NumberFormat('fa-IR').format(agent.totalDebt)} تومان</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
    )
}


export default function ReportsPage() {

  return (
    <>
      <PageHeader title="گزارشات" />
      <div className="space-y-8">
        <SalesByAgentReport />
        {/* Other reports can be added here as new components */}
      </div>
    </>
  );
}
