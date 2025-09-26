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
import { Card, CardContent } from "@/components/ui/card";
import { salesPartners } from "@/lib/data";

export default function PartnersPage() {
  const calculateCommission = (totalSales: number, commissionRate: number) => {
    return (totalSales * commissionRate) / 100;
  };

  return (
    <>
      <PageHeader title="مدیریت همکاران فروش">
        <Button>افزودن همکار جدید</Button>
      </PageHeader>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام همکار</TableHead>
                <TableHead>نرخ کمیسیون</TableHead>
                <TableHead>مجموع فروش زیرمجموعه</TableHead>
                <TableHead>کمیسیون متعلقه</TableHead>
                <TableHead>
                  <span className="sr-only">اقدامات</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell className="font-code">{partner.commissionRate}%</TableCell>
                  <TableCell className="font-code">
                    {new Intl.NumberFormat('fa-IR').format(partner.totalSubAgentSales)} تومان
                  </TableCell>
                  <TableCell className="font-code text-green-400">
                    {new Intl.NumberFormat('fa-IR').format(
                      calculateCommission(partner.totalSubAgentSales, partner.commissionRate)
                    )} تومان
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
                        <DropdownMenuItem>مشاهده نمایندگان</DropdownMenuItem>
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
