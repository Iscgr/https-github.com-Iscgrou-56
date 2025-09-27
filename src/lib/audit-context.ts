
import { AsyncLocalStorage } from 'async_hooks';
import { Actor } from './types';

const auditContext = new AsyncLocalStorage<Actor>();

/**
 * The Guard Function.
 * Guarantees a valid Actor or throws a runtime error, preventing silent audit failures.
 */
export function getRequiredAuditActor(): Actor {
  const actor = auditContext.getStore();
  if (!actor) {
    throw new Error("AuditError: Actor context is missing. This indicates a critical application error.");
  }
  return actor;
}

/**
 * The Context Provider HOF.
 * Wraps an entry-point function (e.g., a server action) to establish the audit context.
 */
export function withAuditContext<TArgs extends unknown[], TResult>(
  actor: Actor,
  fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    return auditContext.run(actor, () => fn(...args));
  };
}
