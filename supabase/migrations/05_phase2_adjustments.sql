-- =========================================================================
-- 짜투(ZZATU) 2차 MVP — Phase 2 adjustments
-- 라이브 DB 실측 결과(2026-06-04)를 마이그레이션 파일에 반영합니다.
-- 01~04 이후에 실행하면 라이브 DB와 동일한 상태가 됩니다.
--
-- 변경 내역:
--   1. regions.si CHECK 제약에 'all' 값 허용 추가
--   2. regions 테이블에 3개 시 단위 시드 행 추가 (제주시/서귀포시/제주 전체)
--   3. items 테이블에 region_memo, item_name 컬럼 추가
--   4. item_categories 조인 테이블 생성 (+ RLS 정책)
--   5. item_images 테이블 생성 (+ RLS 정책) — 01/02 와 중복이나 멱등성 위해 둠
--
-- 안전성: 모든 명령이 멱등(IF [NOT] EXISTS / ON CONFLICT / DROP POLICY IF EXISTS)
--   이라, 이미 적용된 라이브 DB에서 다시 실행해도 에러 없이 통과합니다.
-- =========================================================================


-- ---------- 1. regions.si CHECK 제약 수정 ----------
alter table public.regions
  drop constraint if exists regions_si_check;

alter table public.regions
  add constraint regions_si_check
  check (si in ('jeju', 'seogwipo', 'all'));


-- ---------- 2. regions 시드: 3개 시 단위 행 추가 ----------
insert into public.regions (si, eupmyeondong, display_order)
values
  ('jeju',     '제주시',               10),
  ('seogwipo', '서귀포시',             20),
  ('all',      '제주 전체(이동 가능)', 30)
on conflict do nothing;


-- ---------- 3. items 테이블 컬럼 추가 ----------
alter table public.items
  add column if not exists region_memo text;

alter table public.items
  add column if not exists item_name text;


-- ---------- 4. item_categories 조인 테이블 (자재-카테고리 다대다) ----------
create table if not exists public.item_categories (
  item_id     uuid     not null references public.items(id)      on delete cascade,
  category_id smallint not null references public.categories(id) on delete no action,
  primary key (item_id, category_id)
);

alter table public.item_categories enable row level security;

-- 정책 1: 모두 조회 가능
drop policy if exists "item_categories are viewable by everyone"
  on public.item_categories;

create policy "item_categories are viewable by everyone"
  on public.item_categories
  for select
  using (true);

-- 정책 2: 본인 자재의 카테고리만 INSERT 가능
drop policy if exists "users can insert own item_categories"
  on public.item_categories;

create policy "users can insert own item_categories"
  on public.item_categories
  for insert
  with check (
    exists (
      select 1 from public.items
      where items.id = item_categories.item_id
        and items.user_id = auth.uid()
    )
  );

-- 정책 3: 본인 자재의 카테고리만 DELETE 가능
drop policy if exists "users can delete own item_categories"
  on public.item_categories;

create policy "users can delete own item_categories"
  on public.item_categories
  for delete
  using (
    exists (
      select 1 from public.items
      where items.id = item_categories.item_id
        and items.user_id = auth.uid()
    )
  );


-- ---------- 5. item_images 테이블 (자재 사진) ----------
-- 주의: item_images 테이블/RLS 는 이미 01_create_tables.sql + 02_setup_rls.sql 에
-- 존재합니다. 아래는 멱등성(새 환경에서도 단독 통과) 차원의 재선언이며, 01 의
-- unique(item_id, display_order) 제약과 최대 10장 트리거가 원본 정의입니다.
create table if not exists public.item_images (
  id            uuid        not null default gen_random_uuid() primary key,
  item_id       uuid        not null references public.items(id) on delete cascade,
  url           text        not null,
  display_order smallint    not null,
  created_at    timestamptz not null default now()
);

alter table public.item_images enable row level security;

-- 정책 1: 모두 조회 가능
drop policy if exists "item_images_select_all"
  on public.item_images;

create policy "item_images_select_all"
  on public.item_images
  for select
  using (true);

-- 정책 2: 본인 자재의 사진만 INSERT 가능
drop policy if exists "item_images_insert_own"
  on public.item_images;

create policy "item_images_insert_own"
  on public.item_images
  for insert
  with check (
    exists (
      select 1 from public.items
      where items.id = item_images.item_id
        and items.user_id = auth.uid()
    )
  );

-- 정책 3: 본인 자재의 사진만 DELETE 가능
drop policy if exists "item_images_delete_own"
  on public.item_images;

create policy "item_images_delete_own"
  on public.item_images
  for delete
  using (
    exists (
      select 1 from public.items
      where items.id = item_images.item_id
        and items.user_id = auth.uid()
    )
  );


-- =========================================================================
-- 끝. 이제 01~05 를 순서대로 실행하면 라이브 DB 와 동일한 상태가 됩니다.
-- =========================================================================
