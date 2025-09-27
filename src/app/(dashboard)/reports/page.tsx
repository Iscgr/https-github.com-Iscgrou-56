
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
import { getAgentSummaries, getAgents } from "@/lib/data";

export const dynamic = 'force-dynamic';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fa-IR').format(Math.round(value)) + ' تومان';

export default async function ReportsPage() {
    const [summaries, agents] = await Promise.all([
        getAgentSummaries(),
        getAgents(),
    ]);

    const agentMap = new Map(agents.map((agent) => [agent.id, agent]));

    const rows = summaries.map((summary) => {
        const agent = agentMap.get(summary.agentId);
        return {
            agentId: summary.agentId,
            name: agent?.name ?? '---',
            code: agent?.code ?? '---',
            totalBilled: summary.totalBilled,
            totalPaid: summary.totalPaid,
            totalDebt: summary.outstandingAmount,
        };
    });

    return (
        <>
            <PageHeader title="گزارشات" />
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>گزارش فروش به تفکیک نماینده</CardTitle>
                                <CardDescription>
                                    مجموع فروش، پرداخت و مانده بدهی هر نماینده بر اساس آخرین محاسبات.
                                </CardDescription>
                            </div>
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
                                {rows.map((row) => (
                                    <TableRow key={row.agentId}>
                                        <TableCell className="font-medium">{row.name}</TableCell>
                                        <TableCell className="font-code">{row.code}</TableCell>
                                        <TableCell className="font-code">{formatCurrency(row.totalBilled)}</TableCell>
                                        <TableCell className="font-code text-green-400">{formatCurrency(row.totalPaid)}</TableCell>
                                        <TableCell className="font-code text-red-400">{formatCurrency(row.totalDebt)}</TableCell>
                                    </TableRow>
                                ))}
                                {rows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            داده‌ای برای نمایش موجود نیست.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
