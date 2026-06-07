-- =========================================================================
-- 짜투(ZZATU) — 찜하기(관심 매물) favorites  [Phase: 찜]
-- 01~08 이후 실행.
--
-- 보안(RLS): 모든 정책이 auth.uid() = user_id 기준 → 본인 찜만 조회/추가/삭제.
--   update 정책 없음(찜은 insert/delete 만) → 수정은 기본 거부.
-- 연쇄 정리: user_id → profiles, item_id → items 모두 ON DELETE CASCADE →
--   탈퇴(auth.users→profiles) 및 매물 삭제 시 favorites 자동 정리.
--
-- 멱등성: IF NOT EXISTS / DROP POLICY IF EXISTS + CREATE.
-- =========================================================================

create table if not exists public.favorites (
  id          uuid        not null default gen_random_uuid() primary key,
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  item_id     uuid        not null references public.items(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, item_id)
);

alter table public.favorites enable row level security;

-- 본인 찜만 조회
drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
  on public.favorites
  for select
  using (auth.uid() = user_id);

-- 본인 명의로만 추가
drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
  on public.favorites
  for insert
  with check (auth.uid() = user_id);

-- 본인 것만 삭제
drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
  on public.favorites
  for delete
  using (auth.uid() = user_id);

create index if not exists idx_favorites_user
  on public.favorites (user_id, created_at desc);

grant select, insert, delete on public.favorites to authenticated;

-- =========================================================================
-- 끝.
-- =========================================================================
