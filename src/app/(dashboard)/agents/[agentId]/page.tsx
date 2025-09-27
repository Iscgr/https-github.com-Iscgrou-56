import { notFound } from 'next/navigation';
import { getAgentById, getInvoicesByAgentId, getPaymentsByAgentId, getSalesPartners } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink } from 'lucide-react';

export default async function AgentProfilePage({
  params,
}: {
  params: { agentId: string };
}) {
  const { agentId } = params;

  // Fetch all data concurrently using promise.all
  const [agent, invoices, payments, salesPartners] = await Promise.all([
    getAgentById(agentId),
    getInvoicesByAgentId(agentId),
    getPaymentsByAgentId(agentId),
    getSalesPartners(),
  ]);

  if (!agent) {
    notFound();
  }

  const salesPartner = salesPartners.find((p) => p.id === agent.partnerId);
  const totalSales = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDebt = Math.max(totalSales - totalPayments, 0);

  // Prepare status labels and colors based on agent status
  const statusMap = {
    'ACTIVE': { label: 'فعال', color: 'bg-green-600' },
    'SUSPENDED': { label: 'مسدود', color: 'bg-yellow-500' },
    'INACTIVE': { label: 'غیرفعال', color: 'bg-red-600' }
  };
  
  const { label: statusLabel, color: statusColor } = statusMap[agent.status] || statusMap.INACTIVE;

  return (
    <div className="flex flex-col gap-4">
      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {agent.avatarUrl ? (
                <Image 
                  src={agent.avatarUrl} 
                  alt={agent.name} 
                  width={64} 
                  height={64} 
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center text-xl font-semibold">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <CardTitle className="text-2xl">{agent.name}</CardTitle>
                <CardDescription className="text-gray-400">{agent.code}</CardDescription>
              </div>
            </div>
            <Badge className={`${statusColor} text-white`}>
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="my-4 bg-gray-600" />
          
          {/* Financial metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-400">فروش کل</p>
              <p className="text-xl font-bold font-code">{new Intl.NumberFormat('fa-IR').format(totalSales)} ریال</p>
            </div>
            <div>
              <p className="text-gray-400">پرداختی کل</p>
              <p className="text-xl font-bold text-green-400 font-code">{new Intl.NumberFormat('fa-IR').format(totalPayments)} ریال</p>
            </div>
            <div>
              <p className="text-gray-400">بدهی فعلی</p>
              <p className="text-xl font-bold text-red-400 font-code">{new Intl.NumberFormat('fa-IR').format(totalDebt)} ریال</p>
            </div>
          </div>
          
          <Separator className="my-4 bg-gray-600" />
          
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-2">اطلاعات تماس</h3>
            <p className="my-1">ایمیل: {agent.email ?? 'ثبت نشده'}</p>
            <p className="my-1">تلفن: {agent.phone ?? 'ثبت نشده'}</p>
            {agent.telegramChatId && <p className="my-1">تلگرام: @{agent.telegramChatId}</p>}
            {salesPartner && (
              <p className="my-1">
                همکار فروش:{' '}
                <Link href={`/partners/${salesPartner.id}`} className="text-cyan-400 hover:underline">
                  {salesPartner.name}
                </Link>
              </p>
            )}
          </div>
          
          <div className="mt-4 flex justify-end">
            <Link 
              href={`/portal/${agent.id}`}
              className="flex items-center text-cyan-400 hover:underline"
              target="_blank"
            >
              مشاهده پرتال عمومی <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
