
import Image from 'next/image';
import Link from 'next/link';
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
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { agents as allAgents, salesPartners } from '@/lib/data';
import { cn } from '@/lib/utils';
import { AgentFormDialog } from './_components/agent-form-dialog';
import { FilePen, User, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const searchTerm = searchParams.q || '';
  const statusFilter = searchParams.status || 'all';
  const sortKey = searchParams.sort || 'name';

  const agents = allAgents
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
      // @ts-ignore
      return b[sortKey] - a[sortKey];
    });

  const getPartnerName = (partnerId: string | null) => {
    if (!partnerId) return '—';
    return salesPartners.find(p => p.id === partnerId)?.name || '—';
  };

  return (
    <>
      <PageHeader title="نمایندگان">
        <AgentFormDialog />
      </PageHeader>

      <Card>
        <div className="p-4 border-b">
            <form className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-auto sm:flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  name="q"
                  placeholder="جستجوی نماینده..."
                  className="pl-9 w-full"
                  defaultValue={searchTerm}
                />
              </div>
              <div className="flex w-full sm:w-auto gap-4">
                 <Select name="status" defaultValue={statusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="فیلتر بر اساس وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="inactive">غیرفعال</SelectItem>
                  </SelectContent>
                </Select>
                <Select name="sort" defaultValue={sortKey}>
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
               <Button type="submit" className="w-full sm:w-auto">اعمال فیلتر</Button>
            </form>
        </div>
        <CardContent className="p-0">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام نماینده</TableHead>
                  <TableHead className="hidden lg:table-cell">همکار فروش</TableHead>
                  <TableHead className="hidden sm:table-cell">مجموع فروش</TableHead>
                  <TableHead className="hidden md:table-cell">پورسانت</TableHead>
                  <TableHead>بدهی نماینده</TableHead>
                  <TableHead className="hidden sm:table-cell">وضعیت</TableHead>
                  <TableHead className="text-left w-[100px]">اقدامات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => {
                  const commission = (agent.totalSales * (agent.commissionRate || 0)) / 100;
                  
                  return (
                    <TableRow key={agent.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link href={`/agents/${agent.id}`} className="flex items-center gap-3 hover:underline">
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
                        </Link>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{getPartnerName(agent.salesPartnerId)}</TableCell>
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
                        >
                           <AgentFormDialog agent={agent}>
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
                          </AgentFormDialog>

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
