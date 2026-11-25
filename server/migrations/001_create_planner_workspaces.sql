CREATE TABLE IF NOT EXISTS planner_workspaces (
  user_id text PRIMARY KEY,
  pages jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(pages) = 'array'),
  quick_todos jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(quick_todos) = 'array'),
  settings jsonb NOT NULL
    CHECK (jsonb_typeof(settings) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
