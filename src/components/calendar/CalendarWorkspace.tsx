import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  acceptInvite,
  createCalendar,
  deleteEvent,
  getCalendar,
  listCalendars,
} from '../../lib/calendarApi';
import { EVENT_COLORS, type CalendarEvent, type CalendarSummary } from '../../types/calendar';
import type { ThemeDefinition } from '../../types/planner';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  LockKeyhole,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { CalendarDialog } from './CalendarDialog';
import { CalendarEventEditor, type EventDraft } from './CalendarEventEditor';
import { CalendarSharingPanel } from './CalendarSharingPanel';

interface CalendarWorkspaceProps {
  theme: ThemeDefinition;
}

const pad = (n: number) => String(n).padStart(2, '0');
const localDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const fromDateKey = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const toLocalInput = (value: string) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const toLocalDateTime = (value: string) => new Date(value).toISOString();
const emptyDraft = (dateKey: string): EventDraft => ({
  title: '',
  description: '',
  startAt: `${dateKey}T09:00`,
  endAt: `${dateKey}T10:00`,
  allDay: false,
  color: 'rose',
});
const monthLabel = (date: Date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const shortDate = (key: string) => fromDateKey(key).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const eventDescription = (event: CalendarEvent) => event.allDay
  ? 'All day'
  : `${formatTime(event.startAt)} – ${formatTime(event.endAt)}`;
const readStoredInvite = () => {
  try { return window.sessionStorage.getItem('komorebi.calendarInvite'); } catch { return null; }
};
const storeInvite = (token: string) => {
  try { window.sessionStorage.setItem('komorebi.calendarInvite', token); } catch { /* URL remains available when storage is blocked. */ }
};
const clearStoredInvite = () => {
  try { window.sessionStorage.removeItem('komorebi.calendarInvite'); } catch { /* Nothing else depends on storage cleanup. */ }
};

export function CalendarWorkspace({ theme }: CalendarWorkspaceProps) {
  const [calendars, setCalendars] = useState<CalendarSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ calendar: CalendarSummary; events: CalendarEvent[] } | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(() => localDateKey(new Date()));
  const [createCalendarOpen, setCreateCalendarOpen] = useState(false);
  const [calendarName, setCalendarName] = useState('');
  const [creatingCalendar, setCreatingCalendar] = useState(false);
  const [calendarCreateError, setCalendarCreateError] = useState<string | null>(null);
  const [eventEditorOpen, setEventEditorOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [draft, setDraft] = useState<EventDraft>(() => emptyDraft(localDateKey(new Date())));
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const listSequence = useRef(0);
  const detailSequence = useRef(0);
  const selectedIdRef = useRef<string | null>(selectedId);
  const editorSessionRef = useRef(0);
  selectedIdRef.current = selectedId;

  const colors = useMemo(() => new Map<string, string>(EVENT_COLORS.map((color) => [color.value, color.hex])), []);
  const selectedCalendar = calendars.find((calendar) => calendar.id === selectedId) ?? null;
  const isOwner = selectedCalendar?.role === 'owner';
  const activeDetail = detail?.calendar.id === selectedId ? detail : null;

  const selectCalendar = (id: string | null) => {
    selectedIdRef.current = id;
    editorSessionRef.current += 1;
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(false);
    setDetailError(null);
    setEventEditorOpen(false);
    setEditingEvent(null);
    setDraft(emptyDraft(selectedDay));
    setDeletingEventId(null);
  };

  const loadCalendars = useCallback(async (preferredId?: string) => {
    const sequence = ++listSequence.current;
    setCalendarLoading(true);
    setCalendarError(null);
    try {
      const rows = await listCalendars();
      if (sequence !== listSequence.current) return rows;
      setCalendars(rows);
      const currentId = selectedIdRef.current;
      const nextId = preferredId && rows.some((row) => row.id === preferredId)
        ? preferredId
        : currentId && rows.some((row) => row.id === currentId) ? currentId : rows[0]?.id ?? null;
      if (nextId !== currentId) selectCalendar(nextId);
      return rows;
    } catch (error) {
      if (sequence === listSequence.current) setCalendarError(error instanceof Error ? error.message : 'Calendars could not be loaded.');
      return null;
    } finally {
      if (sequence === listSequence.current) setCalendarLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCalendars();
  }, [loadCalendars]);

  // A link is only removed after the server confirms acceptance, so a failed invitation can be retried.
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('calendarInvite') || readStoredInvite();
    if (!token) return;
    let cancelled = false;
    setAccepting(true);
    setAcceptError(null);
    acceptInvite(token)
      .then(async ({ calendarId }) => {
        if (cancelled) return;
        const url = new URL(window.location.href);
        url.searchParams.delete('calendarInvite');
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
        clearStoredInvite();
        await loadCalendars(calendarId);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          storeInvite(token);
          setAcceptError(error instanceof Error ? error.message : 'This invitation could not be accepted.');
        }
      })
      .finally(() => {
        if (!cancelled) setAccepting(false);
      });
    return () => { cancelled = true; };
  }, [loadCalendars]);

  const refreshDetail = useCallback(async (id: string) => {
    const sequence = ++detailSequence.current;
    setDetailLoading(true);
    setDetailError(null);
    try {
      const result = await getCalendar(id);
      if (sequence !== detailSequence.current || selectedIdRef.current !== id) return;
      setDetail(result);
    } catch (error) {
      if (sequence === detailSequence.current && selectedIdRef.current === id) {
        setDetail(null);
        setDetailError(error instanceof Error ? error.message : 'This calendar could not be opened.');
      }
    } finally {
      if (sequence === detailSequence.current && selectedIdRef.current === id) setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    void refreshDetail(selectedId);
    return () => { detailSequence.current += 1; };
  }, [selectedId, refreshDetail]);

  useEffect(() => {
    if (!selectedId || selectedCalendar?.role !== 'viewer') return;
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible' && selectedIdRef.current === selectedId) {
        void loadCalendars();
        void refreshDetail(selectedId);
      }
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [selectedId, selectedCalendar?.role, loadCalendars, refreshDetail]);

  const filteredEvents = useMemo(() => {
    if (!activeDetail) return [];
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const startKey = localDateKey(first);
    const endKey = localDateKey(last);
    return activeDetail.events.filter((event) => {
      if (event.allDay) {
        const start = event.startAt.slice(0, 10);
        const end = event.endAt.slice(0, 10);
        return start <= endKey && end >= startKey;
      }
      const start = new Date(event.startAt);
      const end = new Date(event.endAt);
      return start <= new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59, 999) &&
        end > new Date(first.getFullYear(), first.getMonth(), first.getDate());
    }).sort((a, b) => a.startAt.localeCompare(b.startAt));
  }, [activeDetail, month]);

  const monthDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);
  const eventsForDay = useCallback((key: string) => filteredEvents.filter((event) => {
    if (event.allDay) return key >= event.startAt.slice(0, 10) && key <= event.endAt.slice(0, 10);
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    const dayStart = fromDateKey(key);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return start < dayEnd && end > dayStart;
  }), [filteredEvents]);

  const openNewEvent = (dateKey: string) => {
    editorSessionRef.current += 1;
    setSelectedDay(dateKey);
    setEditingEvent(null);
    setDraft(emptyDraft(dateKey));
    setEventEditorOpen(true);
  };
  const openEditEvent = (event: CalendarEvent) => {
    editorSessionRef.current += 1;
    setEditingEvent(event);
    setDraft({
      title: event.title,
      description: event.description,
      startAt: event.allDay ? event.startAt.slice(0, 10) : toLocalInput(event.startAt),
      endAt: event.allDay ? event.endAt.slice(0, 10) : toLocalInput(event.endAt),
      allDay: event.allDay,
      color: event.color,
    });
    setEventEditorOpen(true);
  };
  const closeEventEditor = () => {
    editorSessionRef.current += 1;
    setEventEditorOpen(false);
  };
  const handleEventSaved = (calendarId: string, session: number) => {
    if (selectedIdRef.current !== calendarId || editorSessionRef.current !== session) return;
    editorSessionRef.current += 1;
    setEventEditorOpen(false);
    void refreshDetail(calendarId);
  };
  const removeEvent = async (event: CalendarEvent) => {
    const targetId = selectedId;
    if (!targetId || !isOwner || !window.confirm(`Delete “${event.title}”? This cannot be undone.`)) return;
    setDeletingEventId(event.id);
    try {
      await deleteEvent(targetId, event.id);
      if (selectedIdRef.current === targetId) await refreshDetail(targetId);
    } catch (error) {
      if (selectedIdRef.current === targetId) setDetailError(error instanceof Error ? error.message : 'This plan could not be deleted.');
    } finally {
      if (selectedIdRef.current === targetId) setDeletingEventId(null);
    }
  };

  const submitCalendar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = calendarName.trim();
    if (!name) { setCalendarCreateError('Add a name for your calendar.'); return; }
    setCreatingCalendar(true);
    setCalendarCreateError(null);
    try {
      const created = await createCalendar(name);
      setCalendars((items) => [...items, created]);
      selectCalendar(created.id);
      setCalendarName('');
      setCreateCalendarOpen(false);
    } catch (error) {
      setCalendarCreateError(error instanceof Error ? error.message : 'The calendar could not be created.');
    } finally {
      setCreatingCalendar(false);
    }
  };

  const cardStyle = { backgroundColor: theme.surfaceBg, borderColor: theme.borderColor, color: theme.textPrimary };
  const mutedStyle = { color: theme.textMuted };
  const primaryButton = { backgroundColor: theme.accent, color: '#fff' };
  const monthEventCount = filteredEvents.length;

  return (
    <main className="h-full min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]" style={mutedStyle}>
              <CalendarDays className="h-3.5 w-3.5" /> Your planning pages
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Calendar</h1>
            <p className="mt-1 max-w-xl text-sm" style={mutedStyle}>A little room to see what’s coming, and make space for what matters.</p>
          </div>
          <button type="button" onClick={() => setCreateCalendarOpen(true)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5" style={primaryButton}>
            <Plus className="h-4 w-4" /> New calendar
          </button>
        </header>

        {acceptError && (
          <section className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ ...cardStyle, borderColor: '#D98A68' }} role="alert">
            <div><strong className="text-sm">Invitation needs another try</strong><p className="mt-1 text-sm" style={mutedStyle}>{acceptError}</p></div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={accepting}
                onClick={() => {
                  const token = new URLSearchParams(window.location.search).get('calendarInvite') || readStoredInvite();
                  if (!token) return;
                  setAccepting(true);
                  setAcceptError(null);
                  acceptInvite(token)
                    .then(async ({ calendarId }) => {
                      const url = new URL(window.location.href);
                      url.searchParams.delete('calendarInvite');
                      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
                      clearStoredInvite();
                      await loadCalendars(calendarId);
                    })
                    .catch((error: unknown) => {
                      storeInvite(token);
                      setAcceptError(error instanceof Error ? error.message : 'This invitation could not be accepted.');
                    })
                    .finally(() => setAccepting(false));
                }}
                className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50"
                style={{ borderColor: theme.borderColor }}
              >{accepting ? 'Opening…' : 'Retry invitation'}</button>
              <button
                type="button"
                disabled={accepting}
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('calendarInvite');
                  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
                  clearStoredInvite();
                  setAcceptError(null);
                }}
                className="rounded-lg px-3 py-2 text-sm font-semibold hover:opacity-70 disabled:opacity-50"
                style={mutedStyle}
              >Dismiss</button>
            </div>
          </section>
        )}
        {accepting && <div className="mb-4 rounded-2xl border px-4 py-3 text-sm" style={cardStyle} role="status">Opening your invitation…</div>}

        <div className="grid min-h-[620px] gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 overflow-hidden rounded-[24px] border shadow-sm" style={cardStyle} aria-label="Monthly calendar">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-6" style={{ borderColor: theme.borderColor }}>
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative">
                  <select aria-label="Choose calendar" value={selectedId ?? ''} onChange={(event) => selectCalendar(event.target.value || null)} className="max-w-[190px] appearance-none truncate rounded-xl border py-2 pl-3 pr-8 text-sm font-semibold outline-none focus:ring-2" style={{ ...cardStyle, borderColor: theme.borderColor }}>
                    {calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.name}{calendar.role === 'viewer' ? ' · shared' : ''}</option>)}
                    {!calendars.length && <option value="">No calendars yet</option>}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2" style={mutedStyle} />
                </div>
                {selectedCalendar?.role === 'viewer' && <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: theme.accentSoft, color: theme.accentText }}><Eye className="h-3 w-3" /> View only</span>}
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDay(localDateKey(now)); }} className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:opacity-75" style={{ borderColor: theme.borderColor }}>Today</button>
                <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month" className="rounded-lg p-2 hover:opacity-70"><ChevronLeft className="h-4 w-4" /></button>
                <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month" className="rounded-lg p-2 hover:opacity-70"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>

            {calendarError ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <p className="max-w-md text-sm" role="alert">{calendarError}</p>
                <button type="button" onClick={() => void loadCalendars(selectedId ?? undefined)} className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={primaryButton}><RefreshCw className="h-4 w-4" /> Try again</button>
              </div>
            ) : calendarLoading && calendars.length === 0 ? (
              <div className="grid grid-cols-7 gap-px p-4" aria-label="Loading calendars">
                {Array.from({ length: 35 }, (_, index) => <div key={index} className="min-h-[76px] animate-pulse rounded-lg" style={{ backgroundColor: theme.surfaceAlt, opacity: 0.55 }} />)}
              </div>
            ) : !calendars.length ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.accentSoft, color: theme.accentText }}><CalendarDays className="h-6 w-6" /></div>
                <h2 className="font-display text-xl font-bold">Start with a blank page</h2>
                <p className="mt-2 max-w-sm text-sm leading-6" style={mutedStyle}>Create a calendar for a season, a trip, or the everyday. It begins empty; you choose what belongs here.</p>
                <button type="button" onClick={() => setCreateCalendarOpen(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={primaryButton}><Plus className="h-4 w-4" /> Create your first calendar</button>
                <p className="mt-4 max-w-sm text-xs" style={mutedStyle}>You can invite someone to view a calendar later. They won’t be able to change or add plans.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 pb-3 pt-5 sm:px-6">
                  <h2 className="font-display text-2xl font-bold capitalize sm:text-[28px]">{monthLabel(month)}</h2>
                  <span className="text-xs" style={mutedStyle}>{monthEventCount} {monthEventCount === 1 ? 'plan' : 'plans'}</span>
                </div>
                {detailError && (
                  <div className="mx-4 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm sm:mx-6" style={{ borderColor: theme.borderColor }} role="alert">
                    <span>{detailError}</span>
                    <button type="button" onClick={() => selectedId && void refreshDetail(selectedId)} className="inline-flex items-center gap-1.5 font-semibold"><RefreshCw className="h-3.5 w-3.5" /> Retry</button>
                  </div>
                )}
                <div className="grid grid-cols-7 border-y text-center" style={{ borderColor: theme.borderColor }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div key={day} className="py-2 text-[10px] font-semibold uppercase tracking-wider sm:py-3 sm:text-[11px]" style={mutedStyle}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {monthDays.map((date) => {
                    const key = localDateKey(date);
                    const inMonth = date.getMonth() === month.getMonth();
                    const isToday = key === localDateKey(new Date());
                    const active = key === selectedDay;
                    const dayEvents = eventsForDay(key);
                    return (
                      <button key={key} type="button" onClick={() => setSelectedDay(key)} aria-label={`${shortDate(key)}${dayEvents.length ? `, ${dayEvents.length} plans` : ''}`} aria-pressed={active} className="group relative flex min-h-[64px] flex-col border-b border-r p-1.5 text-left transition-colors sm:min-h-[94px] sm:p-2.5" style={{ borderColor: theme.borderColor, backgroundColor: active ? theme.accentSoft : 'transparent', opacity: inMonth ? 1 : 0.48 }}>
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'ring-1' : ''}`} style={{ backgroundColor: isToday ? theme.accent : 'transparent', color: isToday ? '#fff' : theme.textPrimary, outlineColor: theme.accent }}>{date.getDate()}</span>
                        <div className="mt-1 flex w-full flex-col gap-1 overflow-hidden">
                          {dayEvents.slice(0, 2).map((item) => <span key={item.id} className="hidden truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-4 sm:block" style={{ backgroundColor: `${colors.get(item.color) ?? theme.accent}20`, color: colors.get(item.color) ?? theme.accent }}>{item.title}</span>)}
                          {dayEvents.slice(0, 3).map((item) => <span key={`${item.id}-dot`} aria-hidden="true" className="mx-auto h-1.5 w-1.5 rounded-full sm:hidden" style={{ backgroundColor: colors.get(item.color) ?? theme.accent }} />)}
                          {dayEvents.length > 2 && <span className="hidden text-[9px] leading-3 sm:block" style={mutedStyle}>+{dayEvents.length - 2} more</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {detailLoading && <div className="border-t px-5 py-2 text-xs" style={{ borderColor: theme.borderColor, color: theme.textMuted }} role="status">Refreshing calendar…</div>}
              </>
            )}
          </section>

          <aside className="flex min-w-0 flex-col gap-4">
            <section className="rounded-[24px] border p-4 shadow-sm sm:p-5" style={cardStyle}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={mutedStyle}>Day notes</p>
                  <h2 className="mt-1 font-display text-lg font-bold">{shortDate(selectedDay)}</h2>
                </div>
                {isOwner && selectedCalendar && <button type="button" onClick={() => openNewEvent(selectedDay)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold" style={primaryButton}><Plus className="h-3.5 w-3.5" /> Add plan</button>}
              </div>
              {selectedCalendar?.role === 'viewer' && <p className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: theme.surfaceAlt, color: theme.textMuted }}><LockKeyhole className="h-3.5 w-3.5 shrink-0" /> You can view this calendar, but only its owner can make changes.</p>}
              {!selectedCalendar && !calendarLoading && <p className="mt-4 text-sm" style={mutedStyle}>Choose or create a calendar to begin.</p>}
              <div className="mt-4 flex flex-col gap-2">
                {eventsForDay(selectedDay).map((event) => (
                  <article key={event.id} className="group rounded-2xl border p-3" style={{ borderColor: theme.borderColor, backgroundColor: theme.surfaceAlt }}>
                    <div className="flex items-start gap-2.5">
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors.get(event.color) ?? theme.accent }} />
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-sm font-semibold">{event.title}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs" style={mutedStyle}><Clock3 className="h-3 w-3" />{eventDescription(event)}</p>
                        {event.description && <p className="mt-2 whitespace-pre-wrap text-xs leading-5" style={mutedStyle}>{event.description}</p>}
                        {event.allDay && (event.startAt.slice(0, 10) !== event.endAt.slice(0, 10)) && <p className="mt-1 text-[10px]" style={mutedStyle}>{event.startAt.slice(0, 10)} through {event.endAt.slice(0, 10)}</p>}
                      </div>
                      {isOwner && <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => openEditEvent(event)} aria-label={`Edit ${event.title}`} className="rounded-md p-1.5 text-xs hover:bg-white/70">Edit</button>
                        <button type="button" disabled={deletingEventId === event.id} onClick={() => void removeEvent(event)} aria-label={`Delete ${event.title}`} className="rounded-md p-1.5 text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>}
                    </div>
                  </article>
                ))}
                {!eventsForDay(selectedDay).length && selectedCalendar && (
                  <div className="rounded-2xl border border-dashed px-4 py-5 text-center" style={{ borderColor: theme.borderColor }}>
                    <p className="text-sm font-medium">A little breathing room.</p>
                    <p className="mt-1 text-xs" style={mutedStyle}>{isOwner ? 'Nothing planned yet. Leave the day open, or add something.' : 'There are no plans on this day.'}</p>
                    {isOwner && <button type="button" onClick={() => openNewEvent(selectedDay)} className="mt-3 text-xs font-semibold underline underline-offset-4" style={{ color: theme.accent }}>Add a plan</button>}
                  </div>
                )}
              </div>
            </section>

            <CalendarSharingPanel
              key={selectedId ?? 'no-calendar'}
              theme={theme}
              calendar={selectedCalendar}
              onChanged={(id) => {
                if (selectedIdRef.current === id) void refreshDetail(id);
              }}
            />
          </aside>
        </div>
      </div>

      {createCalendarOpen && (
        <CalendarDialog
          id="create-calendar"
          theme={theme}
          onClose={() => setCreateCalendarOpen(false)}
          closeDisabled={creatingCalendar}
          className="w-full max-w-md rounded-[24px] border p-6 shadow-2xl"
        >
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={mutedStyle}>A fresh page</p><h2 id="create-calendar-title" className="mt-1 font-display text-2xl font-bold">Name your calendar</h2><p className="mt-2 text-sm" style={mutedStyle}>It starts completely blank. Add only what you want to keep in view.</p></div>
              <button type="button" disabled={creatingCalendar} onClick={() => setCreateCalendarOpen(false)} aria-label="Close" className="rounded-lg p-2 hover:opacity-70 disabled:opacity-50"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={(event) => void submitCalendar(event)} className="mt-5">
              <label htmlFor="calendar-name" className="mb-1.5 block text-xs font-semibold">Calendar name</label>
              <input id="calendar-name" autoFocus maxLength={80} value={calendarName} onChange={(event) => setCalendarName(event.target.value)} placeholder="A name that feels like yours" className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2" style={{ backgroundColor: theme.canvasBg, borderColor: theme.borderColor, color: theme.textPrimary }} />
              {calendarCreateError && <p className="mt-2 text-xs text-rose-700" role="alert">{calendarCreateError}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" disabled={creatingCalendar} onClick={() => setCreateCalendarOpen(false)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50" style={{ borderColor: theme.borderColor }}>Cancel</button>
                <button type="submit" disabled={creatingCalendar} className="rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50" style={primaryButton}>{creatingCalendar ? 'Creating…' : 'Create calendar'}</button>
              </div>
            </form>
        </CalendarDialog>
      )}

      {eventEditorOpen && selectedId && isOwner && (
        <CalendarEventEditor
          key={editorSessionRef.current}
          theme={theme}
          calendarId={selectedId}
          session={editorSessionRef.current}
          event={editingEvent}
          dateKey={shortDate(selectedDay)}
          draft={draft}
          onDraftChange={setDraft}
          onClose={closeEventEditor}
          onSaved={handleEventSaved}
          toLocalDateTime={toLocalDateTime}
        />
      )}
    </main>
  );
}
