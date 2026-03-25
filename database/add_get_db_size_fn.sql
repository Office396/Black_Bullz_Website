-- Run this once in Supabase SQL Editor
-- Allows the app to query real database size via supabase.rpc('get_db_size')

create or replace function get_db_size()
returns bigint
language sql
security definer
as $$
  select pg_database_size(current_database());
$$;
