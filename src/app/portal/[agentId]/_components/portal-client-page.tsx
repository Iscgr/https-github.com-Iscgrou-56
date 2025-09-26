
'use client';

import type { Agent } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  BadgePercent,
  Rocket,
  Mail,
  Phone,
  MessageCircle,
  Users
} from 'lucide-react';

const iconMap = {
  ShieldCheck,
  BadgePercent,
  Rocket,
};

type PortalData = {
  totalCustomers: number;
  whyUs: {
    title: string;
    description: string;
    icon: keyof typeof iconMap;
  }[];
  clients: {
    name: string;
    logoUrl: string;
  }[];
}

type PortalClientPageProps = {
  agent: Agent;
  portalData: PortalData;
};

export default function PortalClientPage({
  agent,
  portalData,
}: PortalClientPageProps) {

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="container mx-auto px-4 py-8 md:py-16">
        
        {/* Header Section */}
        <header className="text-center mb-16">
          <Image
            src={agent.avatarUrl}
            alt={`لوگو ${agent.name}`}
            width={128}
            height={128}
            className="rounded-full mx-auto mb-6 border-4 border-primary/20 shadow-lg"
            priority
          />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
            {agent.name}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            نماینده رسمی فروش و خدمات پس از فروش
          </p>
           <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <span className="font-semibold">{portalData.totalCustomers}+</span>
              <span>مشتری فعال</span>
            </div>
        </header>

        {/* Why Us Section */}
        <section className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-10">چرا ما را انتخاب کنید؟</h2>
            <div className="grid md:grid-cols-3 gap-8">
                {portalData.whyUs.map((item, index) => {
                    const Icon = iconMap[item.icon];
                    return (
                        <Card key={index} className="text-center">
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
                                    <Icon className="h-8 w-8" />
                                </div>
                                <CardTitle>{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{item.description}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </section>

        {/* Clients Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-10">برخی از مشتریان ما</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 justify-center">
            {portalData.clients.map((client) => (
              <div key={client.name} className="flex justify-center items-center p-4 bg-muted/50 rounded-lg">
                <Image
                  src={client.logoUrl}
                  alt={client.name}
                  width={120}
                  height={60}
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section>
             <Card className="max-w-3xl mx-auto">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">تماس با ما</CardTitle>
                    <CardDescription>برای دریافت مشاوره و اطلاعات بیشتر با ما در تماس باشید.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-4">
                    <Button asChild size="lg">
                        <a href={`tel:${agent.contact.phone}`}>
                            <Phone className="ml-2 h-5 w-5"/>
                            {agent.contact.phone}
                        </a>
                    </Button>
                     <Button asChild variant="outline" size="lg">
                        <a href={`mailto:${agent.contact.email}`}>
                            <Mail className="ml-2 h-5 w-5"/>
                           {agent.contact.email}
                        </a>
                    </Button>
                    {agent.contact.telegramChatId && (
                         <Button asChild variant="secondary" size="lg">
                            <a href={`https://t.me/${agent.contact.telegramChatId}`} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="ml-2 h-5 w-5"/>
                                تلگرام
                            </a>
                        </Button>
                    )}
                </CardContent>
             </Card>
        </section>

      </div>
       {/* Footer */}
        <footer className="text-center py-6 border-t mt-12">
            <p className="text-sm text-muted-foreground">&copy; ۱۴۰۳ - کلیه حقوق این سامانه محفوظ است.</p>
        </footer>
    </div>
  );
}
