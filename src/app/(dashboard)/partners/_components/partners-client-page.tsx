'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SalesPartner } from '@/lib/types';
import { calculateCommissionAction, exportReportDetailsAsCsvAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export function PartnersClientPage({ partners }: { partners: SalesPartner[] }) {
  // ... (state and handlers from before)
  const [readReplicaLag, setReadReplicaLag] = useState(Math.floor(Math.random() * 20)); // Simulate lag in seconds

  // ... (handleCalculate, handleExport)

  return (
    <div className="grid gap-6">
      
      {/* --- CHANGE START for Item 6.3: Data Freshness Indicator --- */}
      <Alert className="bg-gray-800 border-cyan-600 text-cyan-400">
        <Info className="h-4 w-4" />
        <AlertTitle>راهنمای گزارش‌گیری</AlertTitle>
        <AlertDescription>
          این گزارش‌ها برای کاهش فشار بر سیستم، از روی پایگاه داده ثانویه (Read Replica) خوانده می‌شوند.
          آخرین همگام‌سازی داده‌ها حدوداً {readReplicaLag} ثانیه قبل انجام شده است.
        </AlertDescription>
      </Alert>
      {/* --- CHANGE END --- */}

      <Card className="bg-gray-800 border-gray-700">
        {/* ... (Card content for calculation) */}
      </Card>

      {latestReport && (
        <Card className="bg-gray-800 border-gray-700">
            {/* ... (Card content for report details) */}
        </Card>
      )}
    </div>
  );
}
