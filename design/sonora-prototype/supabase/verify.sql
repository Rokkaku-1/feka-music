-- Transactional verification: creates no lasting users, library rows or quota usage.
begin;
insert into auth.users(id) values
 ('feca0000-0000-4000-8000-000000000001'),
 ('feca0000-0000-4000-8000-000000000002');
insert into public.music_libraries(user_id) values
 ('feca0000-0000-4000-8000-000000000001'),
 ('feca0000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','feca0000-0000-4000-8000-000000000001',true);
do $$ declare changed integer; begin
 if (select count(*) from public.music_libraries)<>1 then raise exception 'RLS isolation failed'; end if;
 if exists(select 1 from public.music_libraries where user_id='feca0000-0000-4000-8000-000000000002') then raise exception 'Other user visible'; end if;
 update public.music_libraries set revision=revision+1 where user_id='feca0000-0000-4000-8000-000000000002';
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'Other user writable'; end if;
end $$;
reset role;
do $$ declare outcome jsonb; test_limit integer; begin
 select coalesce((select searches from public.music_api_daily_usage where day=(now() at time zone 'America/Los_Angeles')::date),0)+1 into test_limit;
 outcome=public.claim_music_search(repeat('a',64),test_limit);
 if outcome->>'status'<>'claimed' then raise exception 'Claim failed: %',outcome; end if;
 outcome=public.claim_music_search(repeat('a',64),test_limit);
 if outcome->>'status'<>'pending' then raise exception 'Deduplication failed'; end if;
 outcome=public.claim_music_search(repeat('b',64),test_limit);
 if outcome->>'status'<>'quota' then raise exception 'Budget limit failed'; end if;
 update public.music_search_cache set results='[]',expires_at=now()+interval '1 hour',lease_until=null where cache_key=repeat('a',64);
 outcome=public.claim_music_search(repeat('a',64),test_limit);
 if outcome->>'status'<>'hit' then raise exception 'Cache reuse failed'; end if;
end $$;
select 'PASS: user isolation, cross-user writes blocked, shared cache, deduplication and quota limit' as verification;
rollback;
