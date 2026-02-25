-- Marketing RPG Team — Database Schema
-- Run this in Supabase SQL Editor

-- Chat history
create table if not exists chat_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  character_id text not null,
  task_id text not null,
  user_message text not null,
  ai_response text not null,
  model_used text not null,
  tokens_input integer default 0,
  tokens_output integer default 0,
  cost_estimate numeric(10, 6) default 0,
  created_at timestamptz default now()
);

-- Daily usage tracking
create table if not exists usage_daily (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  date date not null,
  request_count integer default 0,
  total_cost numeric(10, 6) default 0,
  unique(user_id, date)
);

-- Row Level Security
alter table chat_history enable row level security;
alter table usage_daily enable row level security;

create policy "Users read own chat history"
  on chat_history for select
  using (auth.uid() = user_id);

create policy "Service inserts chat history"
  on chat_history for insert
  with check (true);

create policy "Users read own usage"
  on usage_daily for select
  using (auth.uid() = user_id);

create policy "Service manages usage"
  on usage_daily for all
  with check (true);

-- Indexes
create index if not exists idx_chat_history_user on chat_history(user_id, created_at desc);
create index if not exists idx_usage_daily_user_date on usage_daily(user_id, date);
