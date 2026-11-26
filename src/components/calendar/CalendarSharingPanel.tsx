import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Copy, Eye, RefreshCw, Share2 } from 'lucide-react';
import { inviteViewer, listInvites, revokeInvite } from '../../lib/calendarApi';
import type { CalendarInvite, CalendarSummary } from '../../types/calendar';
import type { ThemeDefinition } from '../../types/planner';

interface CalendarSharingPanelProps {
  theme: ThemeDefinition;
  calendar: CalendarSummary | null;
  onChanged: (calendarId: string) => void;
}

export function CalendarSharingPanel({ theme, calendar, onChanged }: CalendarSharingPanelProps) {
  const [invites, setInvites] = useState<CalendarInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const sequence = useRef(0);
  const isOwner = calendar?.role === 'owner';
  const calendarId = calendar?.id ?? null;
  const cardStyle = { backgroundColor: theme.surfaceBg, borderColor: theme.borderColor, color: theme.textPrimary };
  const mutedStyle = { color: theme.textMuted };

  const load = useCallback(async (id: string) => {
    const requestSequence = ++sequence.current;
    setLoading(true);
    setError(null);
    try {
      const rows = await listInvites(id);
      if (requestSequence === sequence.current) setInvites(rows);
    } catch (cause) {
      if (requestSequence === sequence.current) setError(cause instanceof Error ? cause.message : 'Invitations could not be loaded.');
    } finally {
      if (requestSequence === sequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOwner && calendarId) void load(calendarId);
    else {
      setInvites([]);
      setError(null);
    }
    return () => { sequence.current += 1; };
  }, [calendarId, isOwner, load]);

  const createInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!calendarId || !isOwner) return;
    const targetId = calendarId;
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError('Enter a valid email address.');
      return;
    }
    setSending(true);
    setError(null);
    setToken(null);
    try {
      const result = await inviteViewer(targetId, address);
      setToken(result.token);
      setEmail('');
      await load(targetId);
      onChanged(targetId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The invitation could not be created.');
    } finally {
      setSending(false);
    }
  };

  const copyInvitation = async () => {
    if (!token) return;
    const url = new URL('/app', window.location.origin);
    url.searchParams.set('calendarInvite', token);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
    } catch {
      setError('Copy was blocked by your browser. Select and copy the invitation link below.');
    }
  };

  const revoke = async (invite: CalendarInvite) => {
    if (!calendarId || !window.confirm(`Revoke calendar access for ${invite.email}?`)) return;
    const targetId = calendarId;
    setRevokeId(invite.id);
    setError(null);
    try {
      await revokeInvite(targetId, invite.id);
      await load(targetId);
      onChanged(targetId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Access could not be revoked.');
    } finally {
      setRevokeId(null);
    }
  };

  return (
    <section className="rounded-[24px] border p-4 shadow-sm sm:p-5" style={cardStyle}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: theme.accentSoft, color: theme.accentText }}><Share2 className="h-4 w-4" /></div>
          <div><h2 className="text-sm font-bold">View together</h2><p className="text-[11px]" style={mutedStyle}>Sharing, without editing</p></div>
        </div>
        {isOwner && <span className="rounded-full px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: theme.surfaceAlt, color: theme.textMuted }}>Owner</span>}
      </div>
      {isOwner ? (
        <>
          <p className="mt-3 text-xs leading-5" style={mutedStyle}>Invite someone to see your plans. They’ll need to sign in with the email you enter; access is view-only.</p>
          <form className="mt-3 flex gap-2" onSubmit={(event) => void createInvitation(event)}>
            <label className="sr-only" htmlFor="calendar-invite-email">Viewer email address</label>
            <input id="calendar-invite-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs outline-none focus:ring-2" style={{ backgroundColor: theme.canvasBg, borderColor: theme.borderColor, color: theme.textPrimary }} />
            <button type="submit" disabled={!calendarId || sending} className="rounded-xl px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: theme.accent, color: '#fff' }}>{sending ? 'Creating…' : 'Invite'}</button>
          </form>
          {token && (
            <div className="mt-3 rounded-xl border p-3" style={{ borderColor: theme.borderColor, backgroundColor: theme.surfaceAlt }}>
              <p className="text-xs font-semibold">Invitation link ready</p>
              <p className="mt-1 text-[11px] leading-4" style={mutedStyle}>No email is sent. Copy this link and send it to your invitee. The link expires in 7 days unless accepted.</p>
              <div className="mt-2 flex gap-2">
                <input aria-label="Invitation URL" readOnly value={`${window.location.origin}/app?calendarInvite=${encodeURIComponent(token)}`} className="min-w-0 flex-1 rounded-lg border px-2 py-2 text-[10px]" style={{ backgroundColor: theme.canvasBg, borderColor: theme.borderColor, color: theme.textPrimary }} />
                <button type="button" onClick={() => void copyInvitation()} className="inline-flex items-center gap-1 rounded-lg px-2.5 text-xs font-semibold" style={{ backgroundColor: theme.accent, color: '#fff' }}><Copy className="h-3.5 w-3.5" />{copied ? 'Copied' : 'Copy'}</button>
              </div>
            </div>
          )}
          {error && <p className="mt-2 text-xs text-rose-700" role="alert">{error}</p>}
          <div className="mt-4 border-t pt-3" style={{ borderColor: theme.borderColor }}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold">People with access</h3>
              <button type="button" onClick={() => calendarId && void load(calendarId)} aria-label="Refresh access list" className="rounded p-1 hover:opacity-70"><RefreshCw className="h-3.5 w-3.5" /></button>
            </div>
            {loading ? <p className="text-xs" style={mutedStyle}>Loading invitations…</p> : error ? <button type="button" onClick={() => calendarId && void load(calendarId)} className="text-left text-xs text-rose-700 underline" role="alert">Could not load access. Retry</button> : invites.length ? (
              <ul className="space-y-2">
                {invites.map((invite) => <li key={invite.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate">{invite.email}<span className="ml-1.5" style={mutedStyle}>· {invite.accepted ? 'Accepted' : 'Pending'}</span></span>
                  <button type="button" disabled={revokeId === invite.id} onClick={() => void revoke(invite)} className="shrink-0 rounded px-2 py-1 font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">{revokeId === invite.id ? 'Revoking…' : 'Revoke'}</button>
                </li>)}
              </ul>
            ) : <p className="text-xs" style={mutedStyle}>No invitations yet.</p>}
          </div>
        </>
      ) : calendar?.role === 'viewer' ? (
        <p className="mt-3 flex items-start gap-2 text-xs leading-5" style={mutedStyle}><Eye className="mt-0.5 h-3.5 w-3.5 shrink-0" /> You have view-only access. The calendar owner manages invitations and changes.</p>
      ) : (
        <p className="mt-3 text-xs leading-5" style={mutedStyle}>Create a calendar to invite someone to view your plans.</p>
      )}
    </section>
  );
}
