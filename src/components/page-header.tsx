import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl font-headline">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-gray-400 md:text-base">{description}</p>
        ) : null}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}
