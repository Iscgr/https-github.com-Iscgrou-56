
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { agents } from "@/lib/data";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AgentsPage() {
  return (
    <>
      <PageHeader title="مدیریت نمایندگان">
        <Button>افزودن نماینده جدید</Button>
      </PageHeader>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">آواتار</span>
                </TableHead>
                <TableHead>نام</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead className="hidden md:table-cell">کل فروش</TableHead>
                <TableHead className="hidden md:table-cell">بدهی</TableHead>
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
                    <div className="text-xs text-muted-foreground">{agent.contact.email}</div>
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
                    {new Intl.NumberFormat('fa-IR').format(agent.totalSales - agent.totalPayments)} تومان
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
                        <DropdownMenuItem>ثبت پرداخت</DropdownMenuItem>
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
