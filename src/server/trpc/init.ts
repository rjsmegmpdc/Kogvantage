// ============================================================
// KOGVANTAGE — tRPC Initialization
// Public + Protected procedures with superjson transformer
// ============================================================

import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';

// Context type — extend when auth is added
export interface Context {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
}

export function createContext(): Context {
  // TODO: Extract user session from request headers / cookies
  // once NextAuth integration is wired up. For now, return
  // an unauthenticated context so public procedures work.
  return {};
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// ── Middleware ──────────────────────────────────────────────
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action.',
    });
  }
  return next({ ctx: { user: ctx.user } });
});

// ── Exports ────────────────────────────────────────────────
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const createCallerFactory = t.createCallerFactory;
