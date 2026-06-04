-- =========================================================================
-- 짜투(ZZATU) 2차 MVP — 최근 본 글 (item_views)  [Phase 4 · 4-B]
-- 01~05 이후에 실행. 로그인 유저가 자재 상세를 보면 한 행씩 upsert 된다.
--
-- 멱등성: CREATE TABLE/INDEX IF NOT EXISTS, DROP POLICY IF EXISTS + CREATE 로
--   이미 적용된 DB 에서 다시 실행해도 에러 없이 통과한다.
-- =========================================================================

-- ---------- item_views 테이블 ----------
-- (user_id, item_id) 복합 PK → 같은 글 재조회는 viewed_at 만 갱신(중복 행 없음).
-- 두 FK 모두 on delete cascade → 계정·글 삭제 시 자동 정리.
create table if not exists public.item_views (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  item_id    uuid        not null references public.items(id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.item_views enable row level security;

-- ---------- RLS: 본인 것만 select/insert/update/delete ----------
drop policy if exists "item_views_select_own" on public.item_views;
create policy "item_views_select_own"
  on public.item_views
  for select
  using (auth.uid() = user_id);

drop policy if exists "item_views_insert_own" on public.item_views;
create policy "item_views_insert_own"
  on public.item_views
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "item_views_update_own" on public.item_views;
create policy "item_views_update_own"
  on public.item_views
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "item_views_delete_own" on public.item_views;
create policy "item_views_delete_own"
  on public.item_views
  for delete
  using (auth.uid() = user_id);

-- ---------- 정렬용 인덱스 (최신순 조회) ----------
create index if not exists idx_item_views_user_viewed
  on public.item_views (user_id, viewed_at desc);

-- =========================================================================
-- 끝.
-- =========================================================================
