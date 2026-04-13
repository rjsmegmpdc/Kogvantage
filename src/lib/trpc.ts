// ============================================================
// KOGVANTAGE — Client-side tRPC Setup
// Vanilla client for use in React Server Components and
// client components via @trpc/react-query
// ============================================================

import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import type { AppRouter } from '@/server/trpc/router';

// ── Helper: resolve base URL for both server and client ────
function getBaseUrl(): string {
  // Browser — use relative URL
  if (typeof window !== 'undefined') return '';
  // Vercel / production
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Local dev
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

// ── React Query hooks (client components) ──────────────────
export const trpc = createTRPCReact<AppRouter>();

// ── Vanilla client (RSC / server-side usage) ───────────────
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});

// ── Re-export AppRouter type for convenience ───────────────
export type { AppRouter };
