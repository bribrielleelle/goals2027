import type { EventInput } from '../src/types/calendar';
import { EVENT_COLORS } from '../src/types/calendar';

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export function parseEvent(value: unknown): EventInput | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.title !== 'string' || !v.title.trim() || v.title.trim().length > 200 ||
      typeof v.description !== 'string' || v.description.length > 5000 ||
      typeof v.startAt !== 'string' || typeof v.endAt !== 'string' ||
      typeof v.allDay !== 'boolean' ||
      !EVENT_COLORS.some(c => c.value === v.color)) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  const isoInstant = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
  if (v.allDay) {
    if (!dateOnly.test(v.startAt) || !dateOnly.test(v.endAt)) return null;
    for (const date of [v.startAt, v.endAt]) {
      if (!Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) return null;
    }
    if (v.endAt < v.startAt) return null;
  } else {
    if (!isoInstant.test(v.startAt) || !isoInstant.test(v.endAt)) return null;
    for (const value of [v.startAt, v.endAt]) {
      const day = value.slice(0, 10);
      if (!Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0, 10) !== day) return null;
    }
    const start = Date.parse(v.startAt), end = Date.parse(v.endAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  }
  return { title: v.title.trim(), description: v.description, startAt: v.startAt,
    endAt: v.endAt, allDay: v.allDay, color: v.color as string };
}
