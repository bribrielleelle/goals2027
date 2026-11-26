const key = 'komorebi.calendarInvite';
export function pendingCalendarInvite(): string | null {
  const query = new URLSearchParams(window.location.search).get('calendarInvite');
  if (query && /^[a-f0-9]{64}$/.test(query)) return query;
  try { return sessionStorage.getItem(key); } catch { return null; }
}
export function rememberCalendarInvite(): void {
  const token = pendingCalendarInvite();
  if (token) {
    try { sessionStorage.setItem(key, token); } catch { /* URL is retained where available. */ }
  }
}
