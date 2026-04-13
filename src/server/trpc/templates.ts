// ============================================================
// KOGVANTAGE -- Templates tRPC Router
// CRUD + active template management for governance templates
// ============================================================

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { router, publicProcedure } from './init';
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getActiveTemplate,
  setActiveTemplate,
} from '@/server/services/templates/TemplateService';

const templateTypeEnum = z.enum(['status_report', 'gate_review', 'steering_committee', 'executive_brief']);
const formatEnum = z.enum(['pptx', 'docx', 'xlsx']);
const languageStyleEnum = z.enum(['formal', 'semi-formal', 'concise']);

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: templateTypeEnum,
  format: formatEnum,
  colorPalette: z.array(z.string()).default([]),
  fontPrimary: z.string().default('Calibri'),
  fontHeading: z.string().default('Calibri'),
  languageStyle: languageStyleEnum.default('formal'),
  sectionStructure: z.array(z.string()).default([]),
  toneExamples: z.array(z.string()).default([]),
  logoPath: z.string().nullable().default(null),
});

const updateTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  type: templateTypeEnum.optional(),
  format: formatEnum.optional(),
  colorPalette: z.array(z.string()).optional(),
  fontPrimary: z.string().optional(),
  fontHeading: z.string().optional(),
  languageStyle: languageStyleEnum.optional(),
  sectionStructure: z.array(z.string()).optional(),
  toneExamples: z.array(z.string()).optional(),
  logoPath: z.string().nullable().optional(),
});

export const templatesRouter = router({
  list: publicProcedure.query(() => {
    return listTemplates();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ input }) => {
      const template = getTemplate(input.id);
      if (!template) {
        throw new Error(`Template not found: ${input.id}`);
      }
      return template;
    }),

  create: publicProcedure
    .input(createTemplateSchema)
    .mutation(({ input }) => {
      const id = randomUUID();
      return createTemplate(id, input);
    }),

  update: publicProcedure
    .input(updateTemplateSchema)
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return updateTemplate(id, data);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) => {
      deleteTemplate(input.id);
      return { success: true };
    }),

  getActive: publicProcedure.query(() => {
    return getActiveTemplate();
  }),

  setActive: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) => {
      setActiveTemplate(input.id);
      return { success: true };
    }),
});
