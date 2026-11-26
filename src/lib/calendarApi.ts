import type { CalendarDetail, CalendarInvite, CalendarSummary, EventInput, CalendarEvent } from '../types/calendar';

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`/api/calendar${path}`, {
    method, credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'The calendar request failed. Please try again.');
  }
  return response.status === 204 ? undefined as T : response.json();
}
export const listCalendars = () => request<CalendarSummary[]>('');
export const createCalendar = (name: string) => request<CalendarSummary>('', 'POST', { name });
export const getCalendar = (id: string) => request<CalendarDetail>(`/${id}`);
export const createEvent = (id: string, event: EventInput) => request<CalendarEvent>(`/${id}/events`, 'POST', event);
export const updateEvent = (id: string, eventId: string, event: EventInput) => request<CalendarEvent>(`/${id}/events/${eventId}`, 'PUT', event);
export const deleteEvent = (id: string, eventId: string) => request<void>(`/${id}/events/${eventId}`, 'DELETE');
export const listInvites = (id: string) => request<CalendarInvite[]>(`/${id}/invites`);
export const inviteViewer = (id: string, email: string) => request<{ id: string; token: string }>(`/${id}/invites`, 'POST', { email });
export const revokeInvite = (id: string, inviteId: string) => request<void>(`/${id}/invites/${inviteId}`, 'DELETE');
export const acceptInvite = (token: string) => request<{ calendarId: string }>('/accept', 'POST', { token });
