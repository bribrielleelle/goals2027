export const EVENT_COLORS = [
  { value: 'rose', label: 'Rose', hex: '#DB4F88' },
  { value: 'lavender', label: 'Lavender', hex: '#8B5CF6' },
  { value: 'sage', label: 'Sage', hex: '#38866B' },
  { value: 'blue', label: 'Blue', hex: '#2878B8' },
  { value: 'amber', label: 'Amber', hex: '#B57415' },
  { value: 'coral', label: 'Coral', hex: '#CA583D' },
] as const;

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  color: string;
}
export type EventInput = Omit<CalendarEvent, 'id' | 'calendarId'>;
export interface CalendarSummary {
  id: string;
  name: string;
  role: 'owner' | 'viewer';
}
export interface CalendarInvite {
  id: string;
  email: string;
  accepted: boolean;
}
export interface CalendarDetail {
  calendar: CalendarSummary;
  events: CalendarEvent[];
}
