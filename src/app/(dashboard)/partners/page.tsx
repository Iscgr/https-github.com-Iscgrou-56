
'use client';

import { useState } from 'react';
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
import { salesPartners as initialPartners } from "@/lib/data";
import { PartnerFormDialog } from './_components/partner-form-dialog';
import { useToast } from '@/hooks/use-toast';
import type { SalesPartner } from '@/lib/types';


export default function PartnersPage() {
  const [partners, setPartners] = useState<SalesPartner[]>(initialPartners);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<SalesPartner | undefined>(undefined);
  const { toast } = useToast();

  const calculateCommission = (totalSales: number, commissionRate: number) => {
    return (totalSales * commissionRate) / 100;
  };
  
  const handleFormOpen = (partner?: SalesPartner) => {
    setSelectedPartner(partner);
    setIsFormOpen(true);
  }

  const handlePartnerChange = (changedPartner: SalesPartner) => {
     const isNew = !partners.some(p => p.id === changedPartner.id);
     if (isNew) {
        setPartners(prev => [changedPartner, ...prev]);
        toast({
            title: 'همکار جدید اضافه شد',
            description: `همکار فروش "${changedPartner.name}" با موفقیت اضافه شد.`,
        });
     } else {
        setPartners(prev => prev.map(p => p.id === changedPartner.id ? changedPartner : p));
        toast({
            title: 'همکار ویرایش شد',
            description: `اطلاعات همکار فروش "${changedPartner.name}" بروزرسانی شد.`,
        });
     }
  }

  return (
    <>
      <PageHeader title="مدیریت همکاران فروش">
        <Button onClick={() => handleFormOpen()}>افزودن همکار جدید</Button>
      </PageHeader>
      
      <PartnerFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onPartnerChanged={handlePartnerChange}
        partner={selectedPartner}
      />

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
              {partners.map((partner) => (
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
                        <DropdownMenuItem onClick={() => handleFormOpen(partner)}>ویرایش</DropdownMenuItem>
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
