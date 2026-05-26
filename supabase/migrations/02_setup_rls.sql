-- =========================================================================
-- 짜투(ZZATU) 2차 MVP — RLS(Row Level Security) 정책 설정
-- 누가 어떤 행(row)을 읽고/쓸 수 있는지 DB 차원에서 강제합니다.
-- =========================================================================

-- ---------- RLS 활성화 ----------
alter table public.profiles          enable row level security;
alter table public.items             enable row level security;
alter table public.item_images       enable row level security;
alter table public.chat_rooms        enable row level security;
alter table public.chat_messages     enable row level security;
alter table public.reports           enable row level security;
alter table public.categories        enable row level security;
alter table public.regions           enable row level security;
alter table public.transport_options enable row level security;


-- =========================================================================
-- profiles — 회원 정보
-- =========================================================================
-- 누구나 다른 사용자의 프로필을 볼 수 있음 (닉네임·상호명은 공개 정보)
create policy "profiles_select_all"
on public.profiles for select
using (true);

-- 본인 프로필만 수정·삽입 가능 (회원가입 시 자동 트리거 권장)
create policy "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());


-- =========================================================================
-- items — 자재 게시글
-- =========================================================================
-- 누구나 모든 글 조회 가능 (정지된 사용자 글은 앱에서 필터링)
create policy "items_select_all"
on public.items for select
using (true);

-- 로그인한 사용자만 글 작성 가능 (본인 user_id 로만)
create policy "items_insert_own"
on public.items for insert
with check (user_id = auth.uid());

-- 본인 글만 수정 가능
create policy "items_update_own"
on public.items for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 본인 글만 삭제 가능
create policy "items_delete_own"
on public.items for delete
using (user_id = auth.uid());


-- =========================================================================
-- item_images — 자재 사진
-- =========================================================================
-- 누구나 사진 조회 가능
create policy "item_images_select_all"
on public.item_images for select
using (true);

-- 글 작성자만 사진 추가·삭제 가능
create policy "item_images_insert_own"
on public.item_images for insert
with check (
  exists (
    select 1 from public.items
    where items.id = item_images.item_id
      and items.user_id = auth.uid()
  )
);

create policy "item_images_delete_own"
on public.item_images for delete
using (
  exists (
    select 1 from public.items
    where items.id = item_images.item_id
      and items.user_id = auth.uid()
  )
);


-- =========================================================================
-- chat_rooms — 채팅방
-- =========================================================================
-- 본인이 참여한 채팅방만 조회 가능
create policy "chat_rooms_select_participant"
on public.chat_rooms for select
using (buyer_id = auth.uid() or seller_id = auth.uid());

-- 채팅방 생성은 로그인 사용자가 buyer_id 로 시작
create policy "chat_rooms_insert_buyer"
on public.chat_rooms for insert
with check (buyer_id = auth.uid());

-- 본인이 참여한 채팅방만 안읽음수 등 갱신 가능
create policy "chat_rooms_update_participant"
on public.chat_rooms for update
using (buyer_id = auth.uid() or seller_id = auth.uid())
with check (buyer_id = auth.uid() or seller_id = auth.uid());


-- =========================================================================
-- chat_messages — 채팅 메시지
-- =========================================================================
-- 본인이 참여한 채팅방의 메시지만 조회 가능
create policy "chat_messages_select_participant"
on public.chat_messages for select
using (
  exists (
    select 1 from public.chat_rooms
    where chat_rooms.id = chat_messages.room_id
      and (chat_rooms.buyer_id = auth.uid() or chat_rooms.seller_id = auth.uid())
  )
);

-- 본인이 보낸 메시지만 작성 가능 (채팅방 참여자여야 함)
create policy "chat_messages_insert_sender"
on public.chat_messages for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.chat_rooms
    where chat_rooms.id = chat_messages.room_id
      and (chat_rooms.buyer_id = auth.uid() or chat_rooms.seller_id = auth.uid())
  )
);

-- 메시지 읽음 처리 — 본인이 받은 메시지만 갱신
create policy "chat_messages_update_recipient"
on public.chat_messages for update
using (
  exists (
    select 1 from public.chat_rooms
    where chat_rooms.id = chat_messages.room_id
      and (chat_rooms.buyer_id = auth.uid() or chat_rooms.seller_id = auth.uid())
  )
  and sender_id <> auth.uid()
);


-- =========================================================================
-- reports — 신고
-- =========================================================================
-- 본인이 신고한 건만 조회 가능 (운영자는 service_role 키로 별도 접근)
create policy "reports_select_own"
on public.reports for select
using (reporter_id = auth.uid());

-- 로그인 사용자가 본인 명의로만 신고 가능
create policy "reports_insert_own"
on public.reports for insert
with check (reporter_id = auth.uid());


-- =========================================================================
-- 마스터 테이블 (categories, regions, transport_options)
-- =========================================================================
-- 누구나 조회 가능 (드롭다운 옵션 소스)
create policy "categories_select_all"
on public.categories for select using (true);

create policy "regions_select_all"
on public.regions for select using (true);

create policy "transport_options_select_all"
on public.transport_options for select using (true);

-- 쓰기는 service_role 키로만 가능 (운영자 페이지에서 처리)


-- =========================================================================
-- 회원가입 자동화 트리거
-- auth.users 에 사용자가 생기면 public.profiles 에 자동으로 행 추가
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, kakao_id, nickname, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'provider_id', new.id::text),
    coalesce(new.raw_user_meta_data->>'name', '회원' || substring(new.id::text, 1, 6)),
    new.email
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- =========================================================================
-- 끝. 다음으로 03_seed_data.sql 실행하세요.
-- =========================================================================
