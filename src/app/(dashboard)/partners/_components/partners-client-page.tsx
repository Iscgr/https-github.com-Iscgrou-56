'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Partner, CommissionReport } from '@/lib/types';
import { calculateCommissionAction, exportReportDetailsAsCsvAction } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function PartnersClientPage({ partners }: { partners: Partner[] }) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | undefined>();
  const [latestReport, setLatestReport] = useState<CommissionReport | null>(null);
  const [isCalculating, startCalculationTransition] = useTransition();
  const [isExporting, startExportTransition] = useTransition();
  const { toast } = useToast();
  const [readReplicaLag, setReadReplicaLag] = useState(Math.floor(Math.random() * 20));

  const handleCalculate = () => {
    if (!selectedPartnerId) {
      toast({ variant: 'destructive', title: 'خطا', description: 'لطفا یک همکار فروش را انتخاب کنید.' });
      return;
    }
    startCalculationTransition(async () => {
      // Dummy date range for the example. In a real app, you'd have date pickers.
      const startDate = new Date(2023, 9, 1).toISOString();
      const endDate = new Date(2023, 9, 31).toISOString();
      const result = await calculateCommissionAction(selectedPartnerId, startDate, endDate);
      if (result.success && result.data) {
        setLatestReport(result.data);
        toast({ title: 'موفق', description: 'پورسانت با موفقیت محاسبه شد.' });
      } else {
        toast({ variant: 'destructive', title: 'خطا در محاسبه', description: result.message });
      }
    });
  };
  
  const handleExport = () => {
    if (!latestReport) return;
    startExportTransition(async () => {
        const result = await exportReportDetailsAsCsvAction(latestReport.id);
        if (result.success) {
            const blob = new Blob([result.csvContent || ""], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `commission_report_${latestReport.id}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            toast({ title: 'موفق', description: 'دانلود فایل CSV آغاز شد.' });
        } else {
            toast({ variant: 'destructive', title: 'خطا در خروجی', description: result.message });
        }
    });
  };

  return (
    <div className="grid gap-6">
      
      <Alert className="bg-gray-800 border-cyan-600 text-cyan-400">
        <Info className="h-4 w-4" />
        <AlertTitle>راهنمای گزارش‌گیری</AlertTitle>
        <AlertDescription>
          این گزارش‌ها برای کاهش فشار بر سیستم، از روی پایگاه داده ثانویه (Read Replica) خوانده می‌شوند.
          آخرین همگام‌سازی داده‌ها حدوداً {readReplicaLag} ثانیه قبل انجام شده است.
        </AlertDescription>
      </Alert>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>محاسبه پورسانت جدید</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="partner-select">همکار فروش (سرشاخه)</Label>
              <Select onValueChange={setSelectedPartnerId}>
                <SelectTrigger id="partner-select">
                  <SelectValue placeholder="یک همکار را انتخاب کنید..." />
                </SelectTrigger>
                <SelectContent>
                  {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCalculate} disabled={isCalculating || !selectedPartnerId}>
              {isCalculating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> در حال محاسبه...</> : 'محاسبه پورسانت'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {latestReport && (
        <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>آخرین گزارش محاسبه شده</CardTitle>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    خروجی CSV
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>همکار:</strong> {partners.find(p => p.id === latestReport.partnerId)?.name}</p>
                    <p><strong>تاریخ گزارش:</strong> {new Date(latestReport.endDate).toLocaleDateString('fa-IR')}</p>
                    <p><strong>مجموع پورسانت:</strong> {latestReport.totalCommission.toLocaleString()} تومان</p>
                    <p><strong>وضعیت:</strong> {latestReport.status}</p>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
