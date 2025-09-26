'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link as LinkIcon, Copy, Check } from 'lucide-react';

type PortalLinkHandlerProps = {
  portalLink: string;
};

export function PortalLinkHandler({ portalLink }: PortalLinkHandlerProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState('');

  useEffect(() => {
    // This effect runs only on the client-side, ensuring window.location.origin is available.
    setFullUrl(window.location.origin + portalLink);
  }, [portalLink]);

  const handleCopy = () => {
    if (!fullUrl) return;

    navigator.clipboard.writeText(fullUrl).then(() => {
      setIsCopied(true);
      toast({
        title: 'موفق',
        description: 'لینک پورتال عمومی در کلیپ‌بورد کپی شد.',
      });
      setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'امکان کپی کردن لینک وجود ندارد.',
      });
    });
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <LinkIcon className="h-4 w-4" />
      <Link href={portalLink} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
        لینک پورتال عمومی
      </Link>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
        {isCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        <span className="sr-only">کپی لینک</span>
      </Button>
    </div>
  );
}
