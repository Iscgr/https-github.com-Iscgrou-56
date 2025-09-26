'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { uploadInvoicesAction } from '../actions';
import { FileUp, Loader2 } from 'lucide-react';

// This is a mock parser for demo purposes. In a real app, you'd use a library like SheetJS or PapaParse.
const mockParseFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                // Assuming the file is a simple JSON array of objects for this demo
                const content = event.target?.result as string;
                const data = JSON.parse(content);
                if (!Array.isArray(data)) {
                    throw new Error("File content must be a JSON array.");
                }
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};


export function UploadUsageDataDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'لطفاً ابتدا یک فایل را انتخاب کنید.',
      });
      return;
    }

    startTransition(async () => {
      try {
        // In a real application, you would parse the file content here before sending.
        // For this demo, we'll simulate parsing a JSON file.
        const fileContent = await mockParseFile(file);

        const result = await uploadInvoicesAction(fileContent);

        if (result.success) {
          toast({
            title: 'عملیات موفق',
            description: result.message,
          });
          setIsOpen(false);
          setFile(null);
        } else {
          throw new Error(result.message);
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'پردازش فایل با خطا مواجه شد',
          description: `جزئیات خطا: ${error.message}`,
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <FileUp className="mr-2 h-4 w-4" />
          آپلود فایل فاکتورها
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-white">آپلود دسته‌ای فاکتورها</DialogTitle>
          <DialogDescription>
            یک فایل (با فرمت JSON) حاوی اطلاعات فاکتورها را برای پردازش انتخاب کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invoice-file" className="text-right">
              فایل
            </Label>
            <Input
              id="invoice-file"
              type="file"
              onChange={handleFileChange}
              className="col-span-3 bg-gray-900 border-gray-600 file:text-purple-400"
              accept=".json"
            />
          </div>
          {file && <p className="text-sm text-cyan-400 text-center">فایل انتخاب شده: {file.name}</p>}
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !file}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                در حال پردازش...
              </>
            ) : (
              'شروع پردازش'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
