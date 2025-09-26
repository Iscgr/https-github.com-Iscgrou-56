
'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { processUsageFile } from '../actions';
import type { Invoice } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onNewInvoices: (invoices: Invoice[]) => void;
};

export function UploadUsageDataDialog({ isOpen, onOpenChange, onNewInvoices }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedHashes, setProcessedHashes] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/json') {
        setFile(selectedFile);
      } else {
        toast({
          variant: 'destructive',
          title: 'خطا در نوع فایل',
          description: 'لطفا یک فایل با فرمت JSON انتخاب کنید.',
        });
        setFile(null);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleProcess = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'فایلی انتخاب نشده است',
        description: 'لطفا ابتدا یک فایل مصرف را انتخاب کنید.',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const fileContent = await file.text();
      const result = await processUsageFile({
        jsonData: fileContent,
        processedHashes,
      });

      if (result.errors && result.errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'خطا در اعتبارسنجی داده‌ها',
          description: (
            <ul className="list-disc pr-4">
              {result.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          ),
        });
      }

      if (result.newInvoices && result.newInvoices.length > 0) {
        onNewInvoices(result.newInvoices);
        setProcessedHashes(result.newProcessedHashes ?? []);
        toast({
          title: 'پردازش موفق',
          description: `${result.newInvoices.length} فاکتور جدید با موفقیت ایجاد شد.`,
        });
        onOpenChange(false); // Close dialog on success
      } else if (!result.errors || result.errors.length === 0) {
         toast({
          title: 'بدون تغییر',
          description: 'داده جدید یا قابل پردازشی در فایل یافت نشد. ممکن است داده‌ها تکراری باشند.',
        });
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطای غیرمنتظره',
        description:
          error instanceof Error ? error.message : 'یک خطای ناشناخته رخ داد.',
      });
    } finally {
      setIsProcessing(false);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onOpenChange(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>بارگذاری و پردازش فایل مصرف</DialogTitle>
          <DialogDescription>
            فایل JSON حاوی داده‌های مصرف نمایندگان را برای صدور فاکتور خودکار انتخاب و بارگذاری کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <Alert>
                <AlertTitle className="font-semibold">راهنمای فرمت JSON</AlertTitle>
                <AlertDescription>
                    <p>فایل شما باید آرایه‌ای از آبجکت‌ها با ساختار زیر باشد:</p>
                    <pre className="mt-2 rounded-md bg-muted p-2 text-xs font-code ltr text-left">{`[
  {
    "agentId": "agent-1",
    "usageType": "calls",
    "usageAmount": 120.50,
    "billingPeriodStart": "2023-10-01",
    "billingPeriodEnd": "2023-10-31"
  }
]`}</pre>
                </AlertDescription>
            </Alert>
          <div className="space-y-2">
            <Label htmlFor="usage-file">فایل مصرف (JSON)</Label>
            <div
              className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
              onClick={handleUploadClick}
            >
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                {file ? (
                  <p className="mt-2 text-sm font-medium">{file.name}</p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    برای انتخاب فایل اینجا کلیک کنید
                  </p>
                )}
              </div>
            </div>
            <Input
              id="usage-file"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            انصراف
          </Button>
          <Button onClick={handleProcess} disabled={!file || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                در حال پردازش...
              </>
            ) : (
              'پردازش فایل'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

