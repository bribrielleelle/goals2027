import { useState, type FormEvent } from 'react';
import { Check, LoaderCircle, X } from 'lucide-react';
import { createEvent, updateEvent } from '../../lib/calendarApi';
import { EVENT_COLORS, type CalendarEvent, type EventInput } from '../../types/calendar';
import type { ThemeDefinition } from '../../types/planner';
import { CalendarDialog } from './CalendarDialog';

export interface EventDraft {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  color: string;
}

interface CalendarEventEditorProps {
  theme: ThemeDefinition;
  calendarId: string;
  session: number;
  event: CalendarEvent | null;
  dateKey: string;
  draft: EventDraft;
  onDraftChange: (draft: EventDraft) => void;
  onClose: () => void;
  onSaved: (calendarId: string, session: number) => void;
  toLocalDateTime: (value: string) => string;
}

export function CalendarEventEditor({
  theme,
  calendarId,
  session,
  event,
  dateKey,
  draft,
  onDraftChange,
  onClose,
  onSaved,
  toLocalDateTime,
}: CalendarEventEditorProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutedStyle = { color: theme.textMuted };
  const borderStyle = { borderColor: theme.borderColor };
  const fieldStyle = { backgroundColor: theme.canvasBg, borderColor: theme.borderColor, color: theme.textPrimary };
  const primaryStyle = { backgroundColor: theme.accent, color: '#fff' };
  const titleId = `event-editor-title-${session}`;

  const submit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    if (!draft.title.trim()) {
      setError('Give this plan a title before saving.');
      return;
    }
    if (!draft.startAt || !draft.endAt ||
        !Number.isFinite(new Date(draft.startAt).getTime()) ||
        !Number.isFinite(new Date(draft.endAt).getTime())) {
      setError('Enter valid start and end dates.');
      return;
    }
    const input: EventInput = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      allDay: draft.allDay,
      color: draft.color,
      startAt: draft.allDay ? draft.startAt : toLocalDateTime(draft.startAt),
      endAt: draft.allDay ? draft.endAt : toLocalDateTime(draft.endAt),
    };
    if (input.allDay ? input.startAt > input.endAt : new Date(input.startAt) >= new Date(input.endAt)) {
      setError(input.allDay ? 'The end date must be on or after the start date.' : 'The end time must be later than the start time.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (event) await updateEvent(calendarId, event.id, input);
      else await createEvent(calendarId, input);
      onSaved(calendarId, session);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This plan could not be saved.');
      setSaving(false);
    }
  };

  return (
    <CalendarDialog
      id={titleId}
      theme={theme}
      onClose={onClose}
      closeDisabled={saving}
      className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-[24px] border p-5 shadow-2xl sm:p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={mutedStyle}>{event ? 'Make a change' : dateKey}</p>
          <h2 id={`${titleId}-title`} className="mt-1 font-display text-2xl font-bold">{event ? 'Edit plan' : 'Add a plan'}</h2>
        </div>
        <button type="button" disabled={saving} onClick={onClose} aria-label="Close event editor" className="rounded-lg p-2 hover:opacity-70 disabled:opacity-50"><X className="h-4 w-4" /></button>
      </div>
      <form className="mt-5 space-y-4" onSubmit={(submitEvent) => void submit(submitEvent)}>
        <div>
          <label htmlFor={`event-title-${session}`} className="mb-1.5 block text-xs font-semibold">Title</label>
          <input
            id={`event-title-${session}`}
            autoFocus
            maxLength={160}
            required
            value={draft.title}
            onChange={(inputEvent) => onDraftChange({ ...draft, title: inputEvent.target.value })}
            placeholder="What would you like to remember?"
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2"
            style={fieldStyle}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.allDay}
            onChange={(inputEvent) => onDraftChange({
              ...draft,
              allDay: inputEvent.target.checked,
              startAt: inputEvent.target.checked ? draft.startAt.slice(0, 10) : `${draft.startAt.slice(0, 10)}T09:00`,
              endAt: inputEvent.target.checked ? draft.endAt.slice(0, 10) : `${draft.endAt.slice(0, 10)}T10:00`,
            })}
            className="h-4 w-4 accent-pink-600"
          /> All-day plan
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`event-start-${session}`} className="mb-1.5 block text-xs font-semibold">{draft.allDay ? 'Start date' : 'Starts'}</label>
            <input id={`event-start-${session}`} type={draft.allDay ? 'date' : 'datetime-local'} required value={draft.startAt} onChange={(inputEvent) => onDraftChange({ ...draft, startAt: inputEvent.target.value })} className="w-full rounded-xl border px-3 py-2 text-xs outline-none focus:ring-2" style={fieldStyle} />
          </div>
          <div>
            <label htmlFor={`event-end-${session}`} className="mb-1.5 block text-xs font-semibold">{draft.allDay ? 'Last day (inclusive)' : 'Ends'}</label>
            <input id={`event-end-${session}`} type={draft.allDay ? 'date' : 'datetime-local'} required value={draft.endAt} onChange={(inputEvent) => onDraftChange({ ...draft, endAt: inputEvent.target.value })} className="w-full rounded-xl border px-3 py-2 text-xs outline-none focus:ring-2" style={fieldStyle} />
          </div>
        </div>
        <div>
          <label htmlFor={`event-description-${session}`} className="mb-1.5 block text-xs font-semibold">A note <span className="font-normal" style={mutedStyle}>· optional</span></label>
          <textarea id={`event-description-${session}`} rows={3} maxLength={2000} value={draft.description} onChange={(inputEvent) => onDraftChange({ ...draft, description: inputEvent.target.value })} placeholder="Anything you’d like to keep with this plan…" className="w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2" style={fieldStyle} />
        </div>
        <fieldset>
          <legend className="mb-2 text-xs font-semibold">Color</legend>
          <div className="flex flex-wrap gap-2">
            {EVENT_COLORS.map((color) => <button key={color.value} type="button" onClick={() => onDraftChange({ ...draft, color: color.value })} aria-label={`${color.label} event color`} aria-pressed={draft.color === color.value} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-transform hover:scale-[1.03]" style={{ borderColor: draft.color === color.value ? color.hex : theme.borderColor, backgroundColor: draft.color === color.value ? `${color.hex}18` : 'transparent' }}><span className="h-3 w-3 rounded-full" style={{ backgroundColor: color.hex }} />{color.label}{draft.color === color.value && <Check className="h-3 w-3" />}</button>)}
          </div>
        </fieldset>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 border-t pt-4" style={borderStyle}>
          <button type="button" disabled={saving} onClick={onClose} className="rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50" style={borderStyle}>Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50" style={primaryStyle}>{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? 'Saving…' : event ? 'Save changes' : 'Add plan'}</button>
        </div>
      </form>
    </CalendarDialog>
  );
}
