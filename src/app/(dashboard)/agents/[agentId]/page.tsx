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

export default async function AgentProfilePage({
  params,
}: {
  params: { agentId: string };
}) {
  const agentId = params.agentId;

  // Fetch all data concurrently using the new async functions
  const [agent, invoices, payments, salesPartners] = await Promise.all([
    getAgentById(agentId),
    getInvoicesByAgentId(agentId),
    getPaymentsByAgentId(agentId),
    getSalesPartners(),
  ]);

  if (!agent) {
    notFound();
  }

  const salesPartner = salesPartners.find(p => p.id === agent.salesPartnerId);
  const totalSales = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDebt = totalSales - totalPayments;


  return (
    <div className="flex flex-col gap-4">
      {/* ... (rest of the component remains the same, but now uses the fetched data) */}
      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader>
            <div className="flex items-center gap-4">
                <Image src={agent.avatarUrl} alt={agent.name} width={64} height={64} className="rounded-full" />
                <div>
                    <CardTitle className="text-2xl">{agent.name}</CardTitle>
                    <CardDescription>{agent.code}</CardDescription>
                </div>
                <Badge className={agent.status === 'active' ? 'bg-green-600' : 'bg-red-600'}>
                    {agent.status === 'active' ? 'فعال' : 'غیرفعال'}
                </Badge>
            </div>
        </CardHeader>
        <CardContent>
            <Separator className="my-4 bg-gray-600" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-gray-400">فروش کل</p>
                    <p className="text-xl font-bold">{new Intl.NumberFormat('fa-IR').format(totalSales)} ریال</p>
                </div>
                <div>
                    <p className="text-gray-400">پرداختی کل</p>
                    <p className="text-xl font-bold text-green-400">{new Intl.NumberFormat('fa-IR').format(totalPayments)} ریال</p>
                </div>
                <div>
                    <p className="text-gray-400">بدهی فعلی</p>
                    <p className="text-xl font-bold text-red-400">{new Intl.NumberFormat('fa-IR').format(totalDebt)} ریال</p>
                </div>
            </div>
             <Separator className="my-4 bg-gray-600" />
             <div>
                <h3 className="text-lg font-semibold mb-2">اطلاعات تماس</h3>
                <p>ایمیل: {agent.contact.email}</p>
                <p>تلفن: {agent.contact.phone}</p>
                {salesPartner && <p>همکار فروش: <Link href={`/partners/${salesPartner.id}`} className="text-cyan-400 hover:underline">{salesPartner.name}</Link></p>}
             </div>
        </CardContent>
      </Card>
    </div>
  );
}
