import { after as afterAll, before as beforeAll, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { Pool, type PoolClient } from 'pg';
import { calendarRoutes } from './calendarRoutes';
import { parseEvent } from './calendarValidation';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let client: PoolClient;
let server: ReturnType<express.Express['listen']>;
let base: string;
const owner = `calendar-test-owner-${randomUUID()}`;
const viewer = `calendar-test-viewer-${randomUUID()}`;
const outsider = `calendar-test-outsider-${randomUUID()}`;
const viewerEmail = `calendar-${randomUUID()}@example.com`;
let calendarId = '', otherId = '', eventId = '', inviteId = '', token = '';
const input = { title: 'Test appointment', description: 'Integration test', startAt: '2026-11-25T10:00:00Z', endAt: '2026-11-25T11:00:00Z', allDay: false, color: 'rose' };
const expect = (actual: unknown) => ({
  toBe: (expected: unknown) => assert.equal(actual, expected),
  toEqual: (expected: unknown) => assert.deepEqual(actual, expected),
  toBeTruthy: () => assert.ok(actual),
  toBeNull: () => assert.equal(actual, null),
  not: {
    toBeNull: () => assert.notEqual(actual, null),
    toContain: (value: string) => assert.ok(!String(actual).includes(value)),
  },
});

// Test-only identity seam. The real server always uses Clerk requireUser middleware.
beforeAll(async () => {
  client = await pool.connect();
  await client.query('BEGIN');
  const app = express();
  app.use(express.json());
  app.use('/api/calendar', (_req, res, next) => {
    const userId = _req.headers['x-calendar-test-user'];
    if (!userId) { res.status(401).end(); return; }
    res.locals.userId = userId;
    next();
  }, calendarRoutes({ query: client.query.bind(client) } as unknown as Pool,
    async userId => userId === viewer ? [viewerEmail] : []));
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test port unavailable');
  base = `http://127.0.0.1:${address.port}/api/calendar`;
});
afterAll(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  if (client) { await client.query('ROLLBACK'); client.release(); }
  await pool.end();
});
async function api(user: string | null, path = '', method = 'GET', body?: unknown) {
  return fetch(`${base}${path}`, { method, headers: {
    ...(user ? { 'x-calendar-test-user': user } : {}),
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  }, body: body ? JSON.stringify(body) : undefined });
}
describe('calendar access and persistence', () => {
  test('requires an account and never seeds new users', async () => {
    expect((await api(null)).status).toBe(401);
    expect(await (await api(owner)).json()).toEqual([]);
  });
  test('creates private calendars and saves color-coded events', async () => {
    const created = await api(owner, '', 'POST', { name: 'My test calendar' });
    expect(created.status).toBe(201);
    calendarId = (await created.json()).id;
    otherId = (await (await api(outsider, '', 'POST', { name: 'Other' })).json()).id;
    const createdEvent = await api(owner, `/${calendarId}/events`, 'POST', input);
    expect(createdEvent.status).toBe(201);
    const event = await createdEvent.json();
    eventId = event.id;
    expect(event.color).toBe('rose');
    expect((await (await api(owner, `/${calendarId}`)).json()).events[0].title).toBe(input.title);
    expect((await api(outsider, `/${calendarId}`)).status).toBe(404);
  });
  test('keeps invites private and binds acceptance to verified recipient email', async () => {
    const invitation = await api(owner, `/${calendarId}/invites`, 'POST', { email: viewerEmail });
    expect(invitation.status).toBe(201);
    ({ id: inviteId, token } = await invitation.json());
    expect((await api(outsider, '/accept', 'POST', { token })).status).toBe(403);
    expect((await api(viewer, `/${calendarId}`)).status).toBe(404);
    expect((await api(viewer, '/accept', 'POST', { token })).status).toBe(200);
    expect((await api(viewer, '/accept', 'POST', { token })).status).toBe(200);
    const shared = await (await api(viewer, `/${calendarId}`)).json();
    expect(shared.calendar.role).toBe('viewer');
    expect(shared.events[0].id).toBe(eventId);
    expect((await (await api(viewer)).json()).find((c: { id: string }) => c.id === calendarId)).toBeTruthy();
    expect(JSON.stringify(await (await api(owner, `/${calendarId}/invites`)).json())).not.toContain(token);
  });
  test('viewers cannot create, edit, delete events or manage sharing', async () => {
    for (const [path, method, body] of [
      [`/${calendarId}/events`, 'POST', input],
      [`/${calendarId}/events/${eventId}`, 'PUT', input],
      [`/${calendarId}/events/${eventId}`, 'DELETE', undefined],
      [`/${calendarId}/invites`, 'GET', undefined],
      [`/${calendarId}/invites`, 'POST', { email: 'another@example.com' }],
      [`/${calendarId}/invites/${inviteId}`, 'DELETE', undefined],
    ] as const) expect((await api(viewer, path, method, body)).status).toBe(403);
  });
  test('rejects cross-calendar event IDs and invalid dates; owner can edit', async () => {
    expect((await api(outsider, `/${otherId}/events/${eventId}`, 'PUT', input)).status).toBe(404);
    expect((await api(outsider, `/${otherId}/events/${eventId}`, 'DELETE')).status).toBe(404);
    expect((await api(owner, `/${calendarId}/events`, 'POST', { ...input, endAt: input.startAt })).status).toBe(400);
    expect((await api(owner, `/${calendarId}/events/${eventId}`, 'PUT', { ...input, color: 'sage' })).status).toBe(200);
    expect((await (await api(viewer, `/${calendarId}`)).json()).events[0].color).toBe('sage');
  });
  test('revocation immediately removes access and disables invitation link', async () => {
    expect((await api(owner, `/${calendarId}/invites/${inviteId}`, 'DELETE')).status).toBe(204);
    expect((await api(viewer, `/${calendarId}`)).status).toBe(404);
    expect((await api(viewer, '/accept', 'POST', { token })).status).toBe(404);
    expect(await (await api(viewer)).json()).toEqual([]);
  });
  test('expired pending invitation cannot be redeemed and events delete persistently', async () => {
    const invitation = await (await api(owner, `/${calendarId}/invites`, 'POST', { email: viewerEmail })).json();
    await client.query(`UPDATE calendar_invites SET expires_at=now()-interval '1 day' WHERE id=$1`, [invitation.id]);
    expect((await api(viewer, '/accept', 'POST', { token: invitation.token })).status).toBe(404);
    expect((await api(owner, `/${calendarId}/events/${eventId}`, 'DELETE')).status).toBe(204);
    expect((await (await api(owner, `/${calendarId}`)).json()).events).toEqual([]);
  });
});
test('event validation preserves inclusive all-day dates and rejects bad colors/dates', () => {
  expect(parseEvent({ ...input, allDay: true, startAt: '2026-11-25', endAt: '2026-11-25' })).not.toBeNull();
  expect(parseEvent({ ...input, allDay: true, startAt: '2026-02-30', endAt: '2026-03-01' })).toBeNull();
  expect(parseEvent({ ...input, color: 'invisible' })).toBeNull();
  expect(parseEvent({ ...input, title: '   ' })).toBeNull();
  expect(parseEvent({ ...input, startAt: '2026-02-30T10:00:00Z', endAt: '2026-03-03T11:00:00Z' })).toBeNull();
});
