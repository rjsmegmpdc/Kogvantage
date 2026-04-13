// ============================================================
// KOGVANTAGE — AI Operations tRPC Procedures
// Wraps ClaudeService for chat, analysis, and report generation
// ============================================================

import { z } from 'zod';
import { router, publicProcedure } from './init';
import * as ClaudeService from '@/server/services/ai/ClaudeService';

// ── Helpers ──────────────────────────────────────────────────

function aiErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.includes('ANTHROPIC_API_KEY')) {
    return 'AI features are unavailable. Please configure your ANTHROPIC_API_KEY in the environment.';
  }
  if (err instanceof Error) {
    return `AI request failed: ${err.message}`;
  }
  return 'An unexpected error occurred while processing the AI request.';
}

// ── Router ────────────────────────────────────────────────────

export const aiRouter = router({
  chat: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.string(),
            content: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await ClaudeService.chat(
          input.messages as ClaudeService.ChatMessage[]
        );
        return { success: true, response };
      } catch (err) {
        return { success: false, response: aiErrorMessage(err) };
      }
    }),

  analyzePortfolio: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const response = await ClaudeService.analyzePortfolio(input.query);
        return { success: true, response };
      } catch (err) {
        return { success: false, response: aiErrorMessage(err) };
      }
    }),

  generateWBS: publicProcedure
    .input(z.object({ description: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const wbs = await ClaudeService.generateWBS(input.description);
        return { success: true, wbs };
      } catch (err) {
        return { success: false, wbs: [], error: aiErrorMessage(err) };
      }
    }),

  analyzeVariance: publicProcedure
    .input(
      z.object({
        alerts: z.array(
          z.object({
            type: z.string(),
            severity: z.string(),
            message: z.string(),
            entity_type: z.string(),
            variance_amount: z.number(),
            variance_percent: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await ClaudeService.analyzeVariance(input.alerts);
        return { success: true, response };
      } catch (err) {
        return { success: false, response: aiErrorMessage(err) };
      }
    }),

  estimateEffort: publicProcedure
    .input(z.object({ description: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const response = await ClaudeService.estimateEffort(input.description);
        return { success: true, response };
      } catch (err) {
        return { success: false, response: aiErrorMessage(err) };
      }
    }),

  generateReport: publicProcedure
    .input(
      z.object({
        type: z.enum(['weekly', 'monthly', 'executive']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await ClaudeService.generateReport(input.type);
        return { success: true, response };
      } catch (err) {
        return { success: false, response: aiErrorMessage(err) };
      }
    }),
});
