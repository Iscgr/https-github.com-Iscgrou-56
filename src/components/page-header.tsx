import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, children, className }: { title: string, children?: ReactNode, className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between", className)}>
      <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl font-headline">
        {title}
      </h1>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  )
}
