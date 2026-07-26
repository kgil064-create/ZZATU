-- =========================================================================
-- 14. 채팅 미확인 표시 — 읽음 시각(last_read_at) 도입
--
-- 배경: 01_create_tables.sql 이 만든 chat_rooms.buyer_unread_count /
--   seller_unread_count / chat_messages.is_read 는 **어디서도 갱신되지 않아**
--   값을 신뢰할 수 없다. 카운터를 되살리는 대신(증감 누락 시 영구히 어긋남)
--   "언제까지 읽었는가" 시각 하나만 기록하고 미확인 개수는 조회 시점에 센다.
--   → 어긋나도 다음 읽음 처리 때 자동으로 정상화된다.
--
-- 레거시 3개 컬럼은 이번 마이그레이션에서 건드리지 않는다(사용처 없음).
-- =========================================================================


-- ---------- 1. 읽음 시각 컬럼 ----------
-- nullable · 기본값 없음. null = "이 방을 한 번도 읽지 않음" = 전부 미확인.
-- (기존 행은 null 로 들어가므로 기존 대화가 통째로 미확인으로 보이는 게 정상 동작)
alter table public.chat_rooms
  add column if not exists buyer_last_read_at  timestamptz,
  add column if not exists seller_last_read_at timestamptz;


-- ---------- 2. 읽음 처리 RPC ----------
-- 호출자(auth.uid())가 이 방의 buyer 면 buyer_last_read_at, seller 면
-- seller_last_read_at 을 now() 로 갱신한다. 참여자가 아니면 아무 일도 하지 않는다.
--
-- ⚠️ security definer 라 RLS 를 우회한다 — 참여자 검증은 아래 where 절이 유일한
--    방어선이다. where 에서 (buyer_id = v_uid or seller_id = v_uid) 로 행 자체를
--    좁히므로, 참여자가 아닌 호출자는 매칭되는 행이 0건이라 어떤 방도 갱신되지 않는다.
--    case 식은 그 위에 한 겹 더: buyer 는 buyer 컬럼만, seller 는 seller 컬럼만 쓴다.
--    returns void 라 성공/실패가 구분되지 않아 방 존재 여부를 캐낼 수도 없다.
create or replace function public.mark_room_read(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  -- 비로그인(anon)이면 즉시 종료. (아래 where 도 null 비교라 매칭되지 않지만 명시적으로 차단)
  if v_uid is null then
    return;
  end if;

  update public.chat_rooms
    set buyer_last_read_at =
          case when buyer_id = v_uid then now() else buyer_last_read_at end,
        seller_last_read_at =
          case when seller_id = v_uid then now() else seller_last_read_at end
    where id = p_room_id
      and (buyer_id = v_uid or seller_id = v_uid);
end;
$$;

-- create function 은 기본적으로 public(=모든 롤)에 execute 를 준다.
-- security definer 함수에서는 그 기본값을 걷어내고 필요한 롤에만 명시적으로 부여한다.
revoke execute on function public.mark_room_read(uuid) from public;
grant  execute on function public.mark_room_read(uuid) to authenticated;


-- ---------- 3. 레거시 컬럼 표시(삭제하지 않음) ----------
-- 세 컬럼 모두 어디서도 갱신되지 않아 값이 의미 없다. 지금 지우면 되돌리기 번거롭고
-- 남은 참조를 놓칠 수 있어, 이번에는 주석으로만 못 박고 정리는 나중에 한다.
-- (psql \d+ · Supabase Table Editor 의 컬럼 설명에 그대로 노출된다)
comment on column public.chat_rooms.buyer_unread_count is
  '미사용 — 14번에서 last_read_at 방식으로 대체됨. 조회에 쓰지 말 것';

comment on column public.chat_rooms.seller_unread_count is
  '미사용 — 14번에서 last_read_at 방식으로 대체됨. 조회에 쓰지 말 것';

comment on column public.chat_messages.is_read is
  '미사용 — 14번에서 last_read_at 방식으로 대체됨. 조회에 쓰지 말 것';
