-- =========================================================================
-- 짜투(ZZATU) — 지표/집계 인프라 (analytics)  [그룹6]
-- 01~11 이후에 실행.
--
-- 포함:
--   1. items.favorite_count 카운터 컬럼
--   2. favorites INSERT/DELETE → items.favorite_count 동기화 트리거 (+ 초기값 백필)
--   3. increment_view_count(uuid) RPC (조회수 +1, 함수로만 접근)
--   4. item_inquiries (전화/채팅 문의 기록)
--   5. search_logs + log_search(text,int) RPC (비로그인 포함 검색 기록)
--
-- 멱등성: ADD COLUMN IF NOT EXISTS / create or replace / drop ... if exists +
--   create / create table if not exists / create index if not exists →
--   이미 적용된 DB 에서 다시 실행해도 에러 없이 통과한다.
-- =========================================================================


-- =========================================================================
-- 1. items.favorite_count 카운터 (view_count 는 이미 존재하므로 추가 안 함)
-- =========================================================================
alter table public.items
  add column if not exists favorite_count integer not null default 0;


-- =========================================================================
-- 2. 찜 수 동기화 트리거
-- =========================================================================
-- ⚠️ SECURITY DEFINER 필수: 찜하는 사람은 대개 글 주인이 아니라서, 트리거가
--    SECURITY INVOKER 로 items 를 UPDATE 하면 items_update_own(user_id=auth.uid())
--    RLS 에 막혀 카운터가 안 오른다. DEFINER 로 소유자 권한 실행하여 RLS 를 우회한다.
create or replace function public.sync_favorite_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.items
      set favorite_count = favorite_count + 1
      where id = new.item_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.items
      set favorite_count = greatest(favorite_count - 1, 0)  -- 음수 방지
      where id = old.item_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_favorites_count on public.favorites;
create trigger trg_favorites_count
  after insert or delete on public.favorites
  for each row execute function public.sync_favorite_count();

-- 초기값 백필: 모든 items 를 실제 찜 수로 정확히 재계산(찜 0개면 0). 재실행 시 자기치유.
update public.items i
  set favorite_count = coalesce(
    (select count(*) from public.favorites f where f.item_id = i.id),
    0
  );


-- =========================================================================
-- 3. 조회수 증가 RPC (items RLS 는 열지 않고 함수로만 접근)
-- =========================================================================
create or replace function public.increment_view_count(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.items
    set view_count = view_count + 1
    where id = p_item_id;
end;
$$;

grant execute on function public.increment_view_count(uuid) to anon, authenticated;


-- =========================================================================
-- 4. item_inquiries — 전화/채팅 문의 기록
-- =========================================================================
-- ⚠️ unique 제약 없음: 같은 사람이 다시 문의해도 별개 행으로 센다(반복 = 강한 신호).
create table if not exists public.item_inquiries (
  id            uuid        not null default gen_random_uuid() primary key,
  item_id       uuid        not null references public.items(id)    on delete cascade,
  user_id       uuid        not null references public.profiles(id) on delete cascade,
  inquiry_type  text        not null check (inquiry_type in ('phone', 'chat')),
  created_at    timestamptz not null default now()
);

alter table public.item_inquiries enable row level security;

-- 본인 명의로만 기록 가능. select 정책 없음 → 운영자만 service_role 로 조회.
drop policy if exists "item_inquiries_insert_own" on public.item_inquiries;
create policy "item_inquiries_insert_own"
  on public.item_inquiries
  for insert
  with check (auth.uid() = user_id);

create index if not exists idx_item_inquiries_item_created
  on public.item_inquiries (item_id, created_at desc);
create index if not exists idx_item_inquiries_created
  on public.item_inquiries (created_at desc);

grant insert on public.item_inquiries to authenticated;


-- =========================================================================
-- 5. search_logs — 검색 기록 (비로그인 포함)
-- =========================================================================
create table if not exists public.search_logs (
  id            uuid        not null default gen_random_uuid() primary key,
  keyword       text        not null,
  user_id       uuid        references public.profiles(id) on delete set null,  -- 비로그인이면 null
  result_count  integer,
  created_at    timestamptz not null default now()
);

alter table public.search_logs enable row level security;
-- INSERT 정책 없음 — 아래 log_search(SECURITY DEFINER) 로만 기록한다.

create index if not exists idx_search_logs_created
  on public.search_logs (created_at desc);

-- 비로그인도 기록해야 하므로 SECURITY DEFINER. 내부에서 auth.uid()(없으면 null)를 넣는다.
create or replace function public.log_search(p_keyword text, p_result_count integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.search_logs (keyword, user_id, result_count)
  values (p_keyword, auth.uid(), p_result_count);
end;
$$;

grant execute on function public.log_search(text, integer) to anon, authenticated;


-- =========================================================================
-- 끝.
-- =========================================================================
