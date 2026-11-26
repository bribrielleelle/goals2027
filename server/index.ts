import { createServer as createHttpServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clerkClient, clerkMiddleware, getAuth } from '@clerk/express';
import { publishableKeyFromHost } from '@clerk/shared/keys';
import express, { type NextFunction, type Request, type Response } from 'express';
import { Pool } from 'pg';
import { calendarRoutes } from './calendarRoutes';
import type { PlannerWorkspace } from '../src/data/workspaceDefaults';
import { createEmptyWorkspace } from '../src/data/workspaceDefaults';
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from './middlewares/clerkProxyMiddleware';

const app = express();
const httpServer = createHttpServer(app);
const distDirectory = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 5000);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run the planner API.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await pool.query('SELECT 1');

// Clerk's frontend API proxy must precede body parsing so proxy requests stream unchanged.
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(express.json({ limit: '2mb' }));
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? '',
      process.env.CLERK_PUBLISHABLE_KEY
    ),
  }))
);

function requireUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: 'Sign in to access your workspace.' });
    return;
  }

  res.locals.userId = userId;
  next();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isWorkspacePayload(value: unknown): value is PlannerWorkspace {
  if (!isRecord(value)) return false;
  if (
    !Array.isArray(value.pages) ||
    !Array.isArray(value.quickTodos) ||
    !isRecord(value.settings) ||
    value.pages.length > 200 ||
    value.quickTodos.length > 2000
  ) {
    return false;
  }

  const pagesAreValid = value.pages.every(
    (page) => isRecord(page) && typeof page.id === 'string'
  );
  const todosAreValid = value.quickTodos.every(
    (todo) => isRecord(todo) && typeof todo.id === 'string'
  );

  return pagesAreValid && todosAreValid;
}

app.get('/api/workspace', requireUser, async (_req, res, next) => {
  try {
    const userId = res.locals.userId as string;
    const emptyWorkspace = createEmptyWorkspace();

    await pool.query(
      `INSERT INTO planner_workspaces (user_id, pages, quick_todos, settings)
       VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb)
       ON CONFLICT (user_id) DO NOTHING`,
      [
        userId,
        JSON.stringify(emptyWorkspace.pages),
        JSON.stringify(emptyWorkspace.quickTodos),
        JSON.stringify(emptyWorkspace.settings),
      ]
    );

    const result = await pool.query(
      `SELECT pages, quick_todos AS "quickTodos", settings
       FROM planner_workspaces
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rowCount !== 1) {
      res.status(500).json({ error: 'Workspace could not be loaded.' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put('/api/workspace', requireUser, async (req, res, next) => {
  if (!isWorkspacePayload(req.body)) {
    res.status(400).json({ error: 'The workspace data is invalid.' });
    return;
  }

  try {
    const userId = res.locals.userId as string;
    const { pages, quickTodos, settings } = req.body;
    const result = await pool.query(
      `INSERT INTO planner_workspaces (user_id, pages, quick_todos, settings)
       VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb)
       ON CONFLICT (user_id) DO UPDATE SET
         pages = EXCLUDED.pages,
         quick_todos = EXCLUDED.quick_todos,
         settings = EXCLUDED.settings,
         updated_at = now()
       RETURNING pages, quick_todos AS "quickTodos", settings`,
      [userId, JSON.stringify(pages), JSON.stringify(quickTodos), JSON.stringify(settings)]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.use('/api/calendar', requireUser, calendarRoutes(pool));

app.delete('/api/account', requireUser, async (_req, res, next) => {
  try {
    const userId = res.locals.userId as string;

    await pool.query('DELETE FROM planner_workspaces WHERE user_id = $1', [userId]);
    await clerkClient.users.deleteUser(userId);
    await pool.query('DELETE FROM calendars WHERE owner_id = $1', [userId]);
    await pool.query('DELETE FROM calendar_invites WHERE accepted_user_id = $1', [userId]);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.error('Planner API request failed:', error);
  if (res.headersSent) {
    next(error);
    return;
  }
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDirectory));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distDirectory, 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    appType: 'spa',
    server: {
      middlewareMode: true,
      hmr:
        process.env.DISABLE_HMR === 'true'
          ? false
          : { server: httpServer },
    },
  });
  app.use(vite.middlewares);
  httpServer.on('close', () => void vite.close());
}

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Komorebi planner listening on port ${port}`);
});
