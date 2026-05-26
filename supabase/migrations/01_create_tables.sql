-- =========================================================================
-- 짜투(ZZATU) 2차 MVP — 테이블 생성 스크립트
-- 실행 순서: 01_create_tables → 02_setup_rls → 03_seed_data
-- Supabase 대시보드의 SQL Editor에 통째로 붙여넣어 실행하면 됩니다.
-- =========================================================================

-- ---------- 1. 회원 (profiles) ----------
-- Supabase Auth의 auth.users 와 1:1 로 연결됩니다.
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  kakao_id              text not null unique,
  nickname              text not null,
  business_name         text,
  phone                 text,
  email                 text,
  created_at            timestamptz not null default now(),
  last_login_at         timestamptz,
  is_suspended          boolean not null default false,
  notification_consent  boolean not null default false
);


-- ---------- 2. 카테고리 마스터 (categories) ----------
create table public.categories (
  id             smallserial primary key,
  code           text not null unique,
  name           text not null,
  display_order  smallint not null default 0
);


-- ---------- 3. 지역 마스터 (regions) — 시 + 읍면동 ----------
create table public.regions (
  id             smallserial primary key,
  si             text not null check (si in ('jeju', 'seogwipo')),
  eupmyeondong   text not null,
  display_order  smallint not null default 0,
  unique (si, eupmyeondong)
);


-- ---------- 4. 운반 옵션 마스터 (transport_options) ----------
create table public.transport_options (
  code           text primary key,
  name           text not null,
  display_order  smallint not null default 0
);


-- ---------- 5. 자재 게시글 (items) — 핵심 테이블 ----------
create table public.items (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  type                text not null check (type in ('sell', 'free', 'request')),
  title               text not null,
  spec                text,
  unit                text,
  quantity            integer check (quantity is null or quantity > 0),
  price               integer check (price is null or price >= 0),
  price_option        text not null check (price_option in ('fixed', 'negotiable', 'free')),
  category_id         smallint references public.categories(id),
  condition           text check (condition is null or condition in ('unused', 'new', 'used')),
  region_id           smallint references public.regions(id),
  transport_options   text[] not null default '{}',
  description         text,
  contact_phone       text,
  view_count          integer not null default 0,
  is_sold             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);


-- ---------- 6. 자재 사진 (item_images) — 한 글에 최대 10장 ----------
create table public.item_images (
  id             uuid primary key default gen_random_uuid(),
  item_id        uuid not null references public.items(id) on delete cascade,
  url            text not null,
  display_order  smallint not null default 0,
  created_at     timestamptz not null default now(),
  unique (item_id, display_order)
);

-- 한 글에 최대 10장 제약 (트리거)
create or replace function public.check_item_images_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.item_images where item_id = new.item_id) >= 10 then
    raise exception '사진은 최대 10장까지 업로드할 수 있습니다.';
  end if;
  return new;
end;
$$;

create trigger trg_item_images_limit
before insert on public.item_images
for each row execute function public.check_item_images_limit();


-- ---------- 7. 채팅방 (chat_rooms) ----------
create table public.chat_rooms (
  id                    uuid primary key default gen_random_uuid(),
  item_id               uuid not null references public.items(id) on delete cascade,
  buyer_id              uuid not null references public.profiles(id) on delete cascade,
  seller_id             uuid not null references public.profiles(id) on delete cascade,
  created_at            timestamptz not null default now(),
  last_message_at       timestamptz,
  buyer_unread_count    integer not null default 0,
  seller_unread_count   integer not null default 0,
  unique (item_id, buyer_id),
  check (buyer_id <> seller_id)
);


-- ---------- 8. 채팅 메시지 (chat_messages) ----------
create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  content     text,
  image_url   text,
  sent_at     timestamptz not null default now(),
  is_read     boolean not null default false,
  check (content is not null or image_url is not null)
);


-- ---------- 9. 신고 (reports) ----------
create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.profiles(id) on delete cascade,
  target_type   text not null check (target_type in ('item', 'user', 'message')),
  target_id     uuid not null,
  reason        text not null check (reason in ('fake', 'abusive', 'fraud', 'inappropriate', 'duplicate', 'other')),
  detail        text,
  status        text not null default 'received' check (status in ('received', 'reviewing', 'resolved', 'rejected')),
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz,
  admin_note    text
);


-- =========================================================================
-- updated_at 자동 갱신 트리거 (items 테이블)
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_items_updated_at
before update on public.items
for each row execute function public.set_updated_at();


-- =========================================================================
-- 인덱스 — 검색·필터 성능 최적화
-- =========================================================================

-- pg_trgm 확장 활성화 (품명 부분 검색을 위해 필요)
create extension if not exists pg_trgm;

-- items: 목록 조회·필터링 최적화
create index idx_items_created_at        on public.items (created_at desc);
create index idx_items_type              on public.items (type);
create index idx_items_category_id       on public.items (category_id);
create index idx_items_region_id         on public.items (region_id);
create index idx_items_is_sold           on public.items (is_sold);
create index idx_items_user_id           on public.items (user_id);
-- 운반옵션 배열 검색용 GIN 인덱스
create index idx_items_transport_options on public.items using gin (transport_options);
-- 품명 부분 검색용
create index idx_items_title_trgm        on public.items using gin (title gin_trgm_ops);

-- item_images
create index idx_item_images_item_id on public.item_images (item_id, display_order);

-- chat_rooms
create index idx_chat_rooms_buyer_id  on public.chat_rooms (buyer_id, last_message_at desc);
create index idx_chat_rooms_seller_id on public.chat_rooms (seller_id, last_message_at desc);
create index idx_chat_rooms_item_id   on public.chat_rooms (item_id);

-- chat_messages
create index idx_chat_messages_room_id on public.chat_messages (room_id, sent_at);

-- reports
create index idx_reports_status      on public.reports (status, created_at desc);
create index idx_reports_target      on public.reports (target_type, target_id);
create index idx_reports_reporter_id on public.reports (reporter_id);


-- =========================================================================
-- 끝. 다음으로 02_setup_rls.sql 실행하세요.
-- =========================================================================
