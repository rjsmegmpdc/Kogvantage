// ============================================================
// KOGVANTAGE — Root tRPC Router
// Merges all sub-routers and exports the AppRouter type
// ============================================================

import { router } from './init';
import { projectsRouter } from './projects';
import { tasksRouter } from './tasks';
import { settingsRouter } from './settings';
import { coordinatorRouter } from './coordinator';
import { integrationsRouter } from './integrations';
import { aiRouter } from './ai';
import { ingestionRouter } from './ingestion';

export const appRouter = router({
  projects: projectsRouter,
  tasks: tasksRouter,
  settings: settingsRouter,
  coordinator: coordinatorRouter,
  integrations: integrationsRouter,
  ai: aiRouter,
  ingestion: ingestionRouter,
});

export type AppRouter = typeof appRouter;
