import { Network } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 font-headline text-lg font-semibold text-white">
      <Network className="h-7 w-7 text-primary" />
      <span>MarFaNet</span>
    </div>
  );
}
