-- Step 1: Enable pgvector extension
create extension if not exists vector;

-- Step 2: Drop existing table if it exists (IMPORTANT: This deletes old data)
drop table if exists slack_messages;

-- Step 3: Create table with correct dimension (384 for Xenova/all-MiniLM-L6-v2)
create table slack_messages (
  id text primary key,          -- Slack message ts
  channel_id text,
  user_id text,
  content text,                 -- Renamed from 'text' to 'content'
  embedding vector(384),        -- Updated to 384 dimensions
  created_at timestamptz default now()
);

-- Step 4: Create index for fast similarity search
create index on slack_messages using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Step 5: RPC function for similarity search
create or replace function match_slack_messages (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id text,
  content text,                 -- Returns 'content'
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from slack_messages
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Step 6: Installation store for Slack OAuth
create table if not exists slack_installations (
  team_id text primary key,
  team_name text,
  bot_token text not null,
  bot_user_id text,
  scope text,
  authed_user_id text,
  installed_at timestamptz default now(),
  raw_response jsonb
);
