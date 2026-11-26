import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Pool } from 'pg';
import { clerkClient } from '@clerk/express';
import { isUuid, parseEvent } from './calendarValidation';

const eventColumns = `id, calendar_id AS "calendarId", title, description, start_at AS "startAt", end_at AS "endAt", all_day AS "allDay", color`;
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => { void fn(req, res, next).catch(next); };

export function calendarRoutes(pool: Pool, verifiedEmails = async (userId: string): Promise<string[]> => {
  const user = await clerkClient.users.getUser(userId);
  return user.emailAddresses.filter(email => email.verification?.status === 'verified')
    .map(email => email.emailAddress.toLowerCase());
}) {
  const router = Router();
  router.get('/', wrap(async (_req, res) => {
    const result = await pool.query(
      `SELECT c.id, c.name, CASE WHEN c.owner_id=$1 THEN 'owner' ELSE 'viewer' END AS role
       FROM calendars c WHERE c.owner_id=$1 OR EXISTS
       (SELECT 1 FROM calendar_invites i WHERE i.calendar_id=c.id AND i.accepted_user_id=$1)
       ORDER BY c.created_at`, [res.locals.userId]);
    res.json(result.rows);
  }));
  router.post('/', wrap(async (req, res) => {
    const name = req.body?.name;
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
      res.status(400).json({ error: 'Enter a calendar name of 1–100 characters.' }); return;
    }
    const result = await pool.query(
      `INSERT INTO calendars(id,owner_id,name) VALUES($1,$2,$3) RETURNING id,name,'owner' AS role`,
      [randomUUID(), res.locals.userId, name.trim()]);
    res.status(201).json(result.rows[0]);
  }));
  // An invitation grants access only after sign-in with its verified email.
  router.post('/accept', wrap(async (req, res) => {
    if (typeof req.body?.token !== 'string' || !/^[a-f0-9]{64}$/.test(req.body.token)) {
      res.status(400).json({ error: 'This invitation link is invalid.' }); return;
    }
    const hash = tokenHash(req.body.token);
    const result = await pool.query(
      `SELECT id,email,calendar_id,accepted_user_id,expires_at FROM calendar_invites WHERE token_hash=$1`,
      [hash]);
    const invite = result.rows[0];
    if (!invite || (!invite.accepted_user_id && new Date(invite.expires_at).getTime() < Date.now())) {
      res.status(404).json({ error: 'This invitation has expired or was removed. Ask the owner for a new link.' }); return;
    }
    const userId = res.locals.userId as string;
    if (invite.accepted_user_id === userId) { res.json({ calendarId: invite.calendar_id }); return; }
    const matchesEmail = (await verifiedEmails(userId)).includes(invite.email);
    if (!matchesEmail || (invite.accepted_user_id && invite.accepted_user_id !== userId)) {
      res.status(403).json({ error: 'Sign in with the verified email address this invitation was sent to.' }); return;
    }
    const accepted = await pool.query(
      `UPDATE calendar_invites SET accepted_user_id=$1 WHERE id=$2 AND token_hash=$3
       AND expires_at>now() AND (accepted_user_id IS NULL OR accepted_user_id=$1)
       RETURNING calendar_id`, [userId, invite.id, hash]);
    if (!accepted.rowCount) { res.status(404).json({ error: 'This invitation is no longer available.' }); return; }
    res.json({ calendarId: accepted.rows[0].calendar_id });
  }));

  // Every calendar-specific endpoint goes through the same ownership/read check.
  router.use('/:calendarId', wrap(async (req, res, next) => {
    const id = req.params.calendarId;
    if (!isUuid(id)) { res.status(404).json({ error: 'Calendar not found.' }); return; }
    const result = await pool.query(
      `SELECT c.id,c.name,CASE WHEN c.owner_id=$2 THEN 'owner' ELSE 'viewer' END AS role
       FROM calendars c WHERE c.id=$1 AND (c.owner_id=$2 OR EXISTS
       (SELECT 1 FROM calendar_invites i WHERE i.calendar_id=c.id AND i.accepted_user_id=$2))`,
      [id, res.locals.userId]);
    if (!result.rowCount) { res.status(404).json({ error: 'Calendar not found or access removed.' }); return; }
    res.locals.calendar = result.rows[0];
    next();
  }));
  return finishCalendarRoutes(router, pool);
}

function finishCalendarRoutes(router: Router, pool: Pool) {
  router.get('/:calendarId', wrap(async (_req, res) => {
    const events = await pool.query(`SELECT ${eventColumns} FROM calendar_events WHERE calendar_id=$1 ORDER BY start_at,id`, [res.locals.calendar.id]);
    res.json({ calendar: res.locals.calendar, events: events.rows });
  }));
  const owner = (_req: Request, res: Response, next: NextFunction) => {
    if (res.locals.calendar.role !== 'owner') { res.status(403).json({ error: 'This calendar is view-only. Only its owner can make changes.' }); return; }
    next();
  };
  router.post('/:calendarId/events', owner, wrap(async (req, res) => {
    const event = parseEvent(req.body);
    if (!event) { res.status(400).json({ error: 'Check the title, dates, times, and event color.' }); return; }
    const result = await pool.query(
      `INSERT INTO calendar_events(id,calendar_id,title,description,start_at,end_at,all_day,color)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${eventColumns}`,
      [randomUUID(), res.locals.calendar.id, event.title, event.description, event.startAt, event.endAt, event.allDay, event.color]);
    res.status(201).json(result.rows[0]);
  }));
  router.put('/:calendarId/events/:eventId', owner, wrap(async (req, res) => {
    const event = parseEvent(req.body);
    if (!isUuid(req.params.eventId) || !event) { res.status(400).json({ error: 'Check the title, dates, times, and event color.' }); return; }
    const result = await pool.query(
      `UPDATE calendar_events SET title=$1,description=$2,start_at=$3,end_at=$4,all_day=$5,color=$6
       WHERE id=$7 AND calendar_id=$8 RETURNING ${eventColumns}`,
      [event.title, event.description, event.startAt, event.endAt, event.allDay, event.color, req.params.eventId, res.locals.calendar.id]);
    if (!result.rowCount) { res.status(404).json({ error: 'Event no longer exists.' }); return; }
    res.json(result.rows[0]);
  }));
  router.delete('/:calendarId/events/:eventId', owner, wrap(async (req, res) => {
    if (!isUuid(req.params.eventId)) { res.status(404).json({ error: 'Event not found.' }); return; }
    const result = await pool.query('DELETE FROM calendar_events WHERE id=$1 AND calendar_id=$2', [req.params.eventId, res.locals.calendar.id]);
    if (!result.rowCount) { res.status(404).json({ error: 'Event no longer exists.' }); return; }
    res.status(204).end();
  }));
  router.get('/:calendarId/invites', owner, wrap(async (_req, res) => {
    const result = await pool.query(
      `SELECT id,email,(accepted_user_id IS NOT NULL) AS accepted FROM calendar_invites WHERE calendar_id=$1 ORDER BY email`,
      [res.locals.calendar.id]);
    res.json(result.rows);
  }));
  router.post('/:calendarId/invites', owner, wrap(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Enter a valid email address.' }); return;
    }
    const token = randomBytes(32).toString('hex');
    const result = await pool.query(
      `INSERT INTO calendar_invites(id,calendar_id,email,token_hash) VALUES($1,$2,$3,$4)
       ON CONFLICT(calendar_id,email) DO UPDATE SET token_hash=EXCLUDED.token_hash,
       expires_at=now()+interval '7 days'
       RETURNING id`, [randomUUID(), res.locals.calendar.id, email, tokenHash(token)]);
    res.status(201).json({ id: result.rows[0].id, token });
  }));
  router.delete('/:calendarId/invites/:inviteId', owner, wrap(async (req, res) => {
    if (!isUuid(req.params.inviteId)) { res.status(404).json({ error: 'Invitation not found.' }); return; }
    await pool.query('DELETE FROM calendar_invites WHERE id=$1 AND calendar_id=$2', [req.params.inviteId, res.locals.calendar.id]);
    res.status(204).end();
  }));
  return router;
}
