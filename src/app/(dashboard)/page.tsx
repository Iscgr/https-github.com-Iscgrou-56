'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { DollarSign, Users, CreditCard, AlertTriangle } from 'lucide-react';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';

const kpiData = [
  { title: 'کل فروش (تومان)', value: '۴۵,۲۳۱,۸۹۰', icon: DollarSign, change: '+۲۰.۱٪', changeType: 'increase' },
  { title: 'نمایندگان فعال', value: '۱۲', icon: Users, change: '+۲', changeType: 'increase' },
  { title: 'کل بدهی (تومان)', value: '۳,۰۰۰,۰۰۰', icon: CreditCard, change: '-۵.۲٪', changeType: 'decrease' },
  { title: 'فاکتورهای سررسید گذشته', value: '۳', icon: AlertTriangle, change: '+۱', changeType: 'increase' },
];

const chartData = [
  { month: 'فروردین', sales: 18600000 },
  { month: 'اردیبهشت', sales: 30500000 },
  { month: 'خرداد', sales: 23700000 },
  { month: 'تیر', sales: 27800000 },
  { month: 'مرداد', sales: 18900000 },
  { month: 'شهریور', sales: 23900000 },
];

const chartConfig = {
  sales: {
    label: 'فروش',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="داشبورد" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-code">{kpi.value}</div>
              <p className={`text-xs ${kpi.changeType === 'increase' ? 'text-green-400' : 'text-red-400'}`}>
                {kpi.change} نسبت به ماه گذشته
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>نمودار فروش ۶ ماه اخیر</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ right: 20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value / 1000000}م`}
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--accent))' }}
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))', 
                      borderRadius: 'var(--radius)',
                      direction: 'rtl',
                      fontFamily: 'Vazirmatn'
                    }}
                    formatter={(value: number) => [new Intl.NumberFormat('fa-IR').format(value), 'فروش']}
                  />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
