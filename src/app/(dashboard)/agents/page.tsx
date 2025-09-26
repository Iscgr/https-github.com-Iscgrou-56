
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { agents as initialAgents, salesPartners } from '@/lib/data';
import type { Agent } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AgentFormDialog } from './_components/agent-form-dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, FilePen, User } from 'lucide-react';

type SortKey = 'name' | 'totalSales' | 'totalDebt';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [isAgentFormOpen, setIsAgentFormOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAgentAdded = (newAgent: Agent) => {
    setAgents(prev => [newAgent, ...prev]);
    toast({
      title: 'نماینده جدید اضافه شد',
      description: `نماینده "${newAgent.name}" با موفقیت به لیست اضافه شد.`,
    });
  };

  const filteredAndSortedAgents = useMemo(() => {
    return agents
      .filter(agent => {
        const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              agent.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortKey === 'name') {
          return a.name.localeCompare(b.name);
        }
        return b[sortKey] - a[sortKey];
      });
  }, [agents, searchTerm, statusFilter, sortKey]);

  const getPartnerInfo = (partnerId: string | null) => {
    if (!partnerId) return { name: '—', commissionRate: 0 };
    const partner = salesPartners.find(p => p.id === partnerId);
    return partner ? { name: partner.name, commissionRate: partner.commissionRate } : { name: '—', commissionRate: 0 };
  };

  return (
    <>
      <PageHeader title="نمایندگان">
        <Button onClick={() => setIsAgentFormOpen(true)}>
          <PlusCircle className="ml-2 h-4 w-4" />
          افزودن نماینده جدید
        </Button>
      </PageHeader>

      <AgentFormDialog
        isOpen={isAgentFormOpen}
        onOpenChange={setIsAgentFormOpen}
        onAgentAdded={handleAgentAdded}
      />

      <Card>
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-auto sm:flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجوی نماینده..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full sm:w-auto gap-4">
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="فیلتر بر اساس وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="مرتب سازی بر اساس" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">نام نماینده</SelectItem>
                  <SelectItem value="totalSales">بیشترین فروش</SelectItem>
                  <SelectItem value="totalDebt">بیشترین بدهی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام نماینده</TableHead>
                  <TableHead className="hidden lg:table-cell">همکار فروش</TableHead>
                  <TableHead className="hidden sm:table-cell">مجموع فروش</TableHead>
                  <TableHead className="hidden md:table-cell">کمیسیون</TableHead>
                  <TableHead>بدهی نماینده</TableHead>
                  <TableHead className="hidden sm:table-cell">وضعیت</TableHead>
                  <TableHead className="text-left w-[100px]">اقدامات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedAgents.map((agent) => {
                  const partnerInfo = getPartnerInfo(agent.salesPartnerId);
                  const commission = (agent.totalSales * partnerInfo.commissionRate) / 100;
                  
                  return (
                    <TableRow
                      key={agent.id}
                      onClick={() => router.push(`/agents/${agent.id}`)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Image
                            alt={`آواتار ${agent.name}`}
                            className="aspect-square rounded-full object-cover"
                            height="40"
                            src={agent.avatarUrl}
                            width="40"
                          />
                          <div>
                            <div className="font-semibold">{agent.name}</div>
                            <div className="text-xs text-muted-foreground font-code">{agent.code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{partnerInfo.name}</TableCell>
                      <TableCell className="hidden sm:table-cell font-code">
                        {new Intl.NumberFormat('fa-IR').format(agent.totalSales)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-code text-cyan-400">
                        {new Intl.NumberFormat('fa-IR').format(commission)}
                      </TableCell>
                      <TableCell className="font-code text-red-400">
                        {new Intl.NumberFormat('fa-IR').format(agent.totalDebt)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          className={cn(
                            agent.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20',
                            'hover:bg-none text-xs'
                          )}
                        >
                          {agent.status === 'active' ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()} // Prevent row click
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <FilePen className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>ویرایش نماینده</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                <Link href={`/agents/${agent.id}`}>
                                  <User className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>ورود به پروفایل نماینده</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>
    </>
  );
}
