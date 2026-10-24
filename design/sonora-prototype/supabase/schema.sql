-- Dedicated Feka Music project only. Do not apply to BetLog.
begin;
create table public.music_libraries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  document jsonb not null default '{"version":1,"favorites":[],"playlists":[],"history":[],"genres":[]}',
  revision integer not null default 1 check (revision>0),
  updated_at timestamptz not null default now(),
  constraint valid_music_document check (
    document ?& array['version','favorites','playlists','history','genres']
    and jsonb_typeof(document)='object' and document->>'version'='1'
    and jsonb_typeof(document->'favorites')='array'
    and jsonb_typeof(document->'playlists')='array'
    and jsonb_typeof(document->'history')='array'
    and jsonb_typeof(document->'genres')='array'
    and octet_length(document::text)<=262144
  )
);
alter table public.music_libraries enable row level security;
revoke all on public.music_libraries from anon;
grant select,insert,update,delete on public.music_libraries to authenticated;
create policy "Read own music library" on public.music_libraries for select to authenticated using ((select auth.uid())=user_id);
create policy "Create own music library" on public.music_libraries for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Update own music library" on public.music_libraries for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Delete own music library" on public.music_libraries for delete to authenticated using ((select auth.uid())=user_id);

-- Shared search cache: inaccessible to the browser. Netlify accesses with a server key.
create table public.music_search_cache (
  cache_key text primary key,
  results jsonb,
  expires_at timestamptz,
  lease_until timestamptz
);
alter table public.music_search_cache enable row level security;
revoke all on public.music_search_cache from anon,authenticated;
grant all on public.music_search_cache to service_role;
create table public.music_api_daily_usage (
  day date primary key,
  searches integer not null default 0,
  cache_hits integer not null default 0
);
alter table public.music_api_daily_usage enable row level security;
revoke all on public.music_api_daily_usage from anon,authenticated;
grant all on public.music_api_daily_usage to service_role;

-- Atomic cache lease and shared daily budget: concurrent identical searches use one slot.
create function public.claim_music_search(p_key text,p_limit integer default 100)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare cached public.music_search_cache; usage_day date := (now() at time zone 'America/Los_Angeles')::date; used integer;
begin
  if length(p_key)<>64 or p_limit<1 or p_limit>100000 then raise exception 'Invalid search budget'; end if;
  insert into music_search_cache(cache_key) values(p_key) on conflict do nothing;
  select * into cached from music_search_cache where cache_key=p_key for update;
  if cached.results is not null and cached.expires_at>now() then
    insert into music_api_daily_usage(day,cache_hits) values(usage_day,1) on conflict(day) do update set cache_hits=music_api_daily_usage.cache_hits+1;
    return jsonb_build_object('status','hit','results',cached.results);
  end if;
  if cached.lease_until>now() then return jsonb_build_object('status','pending'); end if;
  insert into music_api_daily_usage(day) values(usage_day) on conflict do nothing;
  update music_api_daily_usage set searches=searches+1 where day=usage_day and searches<p_limit returning searches into used;
  if used is null then return jsonb_build_object('status','quota'); end if;
  update music_search_cache set results=null,expires_at=null,lease_until=now()+interval '20 seconds' where cache_key=p_key;
  return jsonb_build_object('status','claimed','used',used);
end; $$;
revoke all on function public.claim_music_search(text,integer) from public,anon,authenticated;
grant execute on function public.claim_music_search(text,integer) to service_role;
-- The dashboard may provision this internal event trigger with public EXECUTE.
-- Table creation still works as its owner; clients do not need to invoke it.
do $$ begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
  revoke all on function public.rls_auto_enable() from public,anon,authenticated;
 end if;
end $$;
commit;
