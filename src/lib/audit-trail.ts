import { Decimal } from '@prisma/client/runtime/library';

/**
 * Legacy audit trail helper retained for backward compatibility.
 * The real implementation now lives in WalletService and persistence layer.
 */
export async function recordWalletTransaction(_: string, __: Decimal): Promise<boolean> {
  console.warn('[audit-trail] recordWalletTransaction is deprecated and no longer mutates local state.');
  return false;
}