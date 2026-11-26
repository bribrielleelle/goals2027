CREATE TABLE calendars (
  id uuid PRIMARY KEY,
  owner_id text NOT NULL,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX calendars_owner_idx ON calendars(owner_id);
CREATE TABLE calendar_events (
  id uuid PRIMARY KEY,
  calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description text NOT NULL DEFAULT '',
  start_at text NOT NULL,
  end_at text NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  color text NOT NULL
);
CREATE INDEX calendar_events_calendar_idx ON calendar_events(calendar_id);
CREATE TABLE calendar_invites (
  id uuid PRIMARY KEY,
  calendar_id uuid NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  accepted_user_id text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(calendar_id, email)
);
CREATE INDEX calendar_invites_member_idx ON calendar_invites(accepted_user_id);
