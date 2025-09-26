import { Logo } from "@/components/logo";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-card p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Logo />
          <span className="text-sm text-muted-foreground">پورتال نمایندگان</span>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto max-w-5xl p-4 py-8 md:p-8">
          {children}
        </div>
      </main>
      <footer className="border-t bg-card p-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} MarFaNet. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
