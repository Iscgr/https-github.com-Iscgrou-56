
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MoreHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { agents as initialAgents, invoices as initialInvoices, payments as initialPayments } from '@/lib/data';
import type { Agent, Invoice, Payment } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AgentFormDialog } from './_components/agent-form-dialog';
import { PaymentFormDialog } from '../payments/_components/payment-form-dialog';
import { useToast } from '@/hooks/use-toast';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [isAgentFormOpen, setIsAgentFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>(undefined);
  const { toast } = useToast();

  const handleAgentAdded = (newAgent: Agent) => {
    setAgents(prev => [newAgent, ...prev].sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
    toast({
      title: 'نماینده جدید اضافه شد',
      description: `نماینده "${newAgent.name}" با موفقیت به لیست اضافه شد.`,
    });
  };

  const handleOpenPaymentDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsPaymentFormOpen(true);
  };
  
  const handlePaymentAdded = (newPayment: Payment, updatedAgent: Agent, updatedInvoice: Invoice) => {
     setPayments(prev => [newPayment, ...prev].sort((a,b) => Date.parse(b.date) - Date.parse(a.date)));
     setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
     setInvoices(prev => prev.map(i => i.id === updatedInvoice.id ? updatedInvoice : i));
     toast({
        title: 'پرداخت جدید ثبت شد',
        description: `پرداخت به مبلغ ${new Intl.NumberFormat('fa-IR').format(newPayment.amount)} برای نماینده ${updatedAgent.name} ثبت شد.`,
     });
  };


  return (
    <>
      <PageHeader title="مدیریت نمایندگان">
        <Button onClick={() => setIsAgentFormOpen(true)}>افزودن نماینده جدید</Button>
      </PageHeader>

      <AgentFormDialog
        isOpen={isAgentFormOpen}
        onOpenChange={setIsAgentFormOpen}
        onAgentAdded={handleAgentAdded}
      />

      <PaymentFormDialog
        isOpen={isPaymentFormOpen}
        onOpenChange={setIsPaymentFormOpen}
        onPaymentAdded={handlePaymentAdded}
        agent={selectedAgent}
        invoices={invoices.filter(i => i.agentId === selectedAgent?.id && (i.status === 'unpaid' || i.status === 'partial' || i.status === 'overdue'))}
      />

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">آواتار</span>
                </TableHead>
                <TableHead>نماینده</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead className="hidden md:table-cell">کل فروش</TableHead>
                <TableHead className="hidden md:table-cell">بدهی فعلی</TableHead>
                <TableHead>
                  <span className="sr-only">اقدامات</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={`آواتار ${agent.name}`}
                      className="aspect-square rounded-full object-cover"
                      height="40"
                      src={agent.avatarUrl}
                      width="40"
                      data-ai-hint="person portrait"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="font-semibold">{agent.name}</div>
                    <div className="text-xs text-muted-foreground font-code">{agent.code}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={agent.status === 'active' ? 'default' : 'secondary'}
                      className={cn(
                        agent.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-gray-500/20 text-gray-400 border-gray-500/20',
                        'hover:bg-none'
                      )}
                    >
                      {agent.status === 'active' ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-code">
                    {new Intl.NumberFormat('fa-IR').format(agent.totalSales)} تومان
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-code text-red-400">
                    {new Intl.NumberFormat('fa-IR').format(agent.totalDebt)} تومان
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>اقدامات</DropdownMenuLabel>
                        <DropdownMenuItem>ویرایش</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenPaymentDialog(agent)}>ثبت پرداخت</DropdownMenuItem>
                        <DropdownMenuItem asChild>
                           <Link href={agent.portalLink}>مشاهده پورتال</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
