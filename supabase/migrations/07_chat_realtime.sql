-- =========================================================================
-- 짜투(ZZATU) 2차 MVP — 채팅 Realtime 활성화  [Phase 5 · 5-A]
-- chat_messages 를 supabase_realtime publication 에 추가해 INSERT 구독이 동작하게 한다.
--
-- ⚠️ chat_rooms·chat_messages 의 테이블·컬럼·RLS·unique·cascade 는 Phase 0(01·02)에
--    이미 존재하므로 여기서는 손대지 않는다. Storage 정책도 04 에 이미 존재.
--
-- 멱등성: 이미 publication 에 들어 있으면 건너뛴다(중복 add 에러 방지).
-- =========================================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;

-- =========================================================================
-- 끝. 메시지 INSERT 가 Realtime 으로 구독자에게 전달된다(RLS 적용 — 남의 방 안 옴).
-- =========================================================================
