-- =========================================================================
-- 짜투(ZZATU) — 댓글(comments)  [Phase: 댓글]
-- 01~12 이후 실행.
--
-- 포함:
--   1. comments 테이블 + RLS + 인덱스
--   2. item_inquiries.inquiry_type CHECK 재정의 ('comment' 추가)
--
-- 보안(RLS): 목록은 전체 공개(select_all — 비로그인 포함), 작성·삭제는 본인만.
--   update 정책 없음 → 수정은 기본 거부(수정 대신 삭제 후 재작성).
-- 연쇄 정리: item_id → items, user_id → profiles 모두 ON DELETE CASCADE →
--   매물 삭제·회원 탈퇴(08_delete_user) 시 댓글도 함께 사라진다(하드 삭제 정책 유지).
-- 거래유형: 지금은 UI 가 '구해요'에만 댓글을 노출하지만 DB 에는 제한을 걸지 않는다
--   (판매중·나눔으로 넓힐 때 스키마 변경이 필요 없게).
--
-- 멱등성: IF NOT EXISTS / DROP POLICY IF EXISTS + CREATE / 제약은 DROP IF EXISTS
--   후 재생성 → 이미 적용된 DB 에서 다시 실행해도 에러 없이 통과한다.
-- =========================================================================


-- =========================================================================
-- 1. comments — 매물 댓글 (1단, 대댓글 없음)
-- =========================================================================
-- ⚠️ 시간 컬럼은 created_at 이다. chat_messages 만 sent_at 을 쓰고 나머지 테이블은
--    전부 created_at → 프로젝트 표준을 따른다.
-- 길이 제약은 btrim 기준이라 공백만 입력한 댓글은 통과하지 못한다.
create table if not exists public.comments (
  id          uuid        not null default gen_random_uuid() primary key,
  item_id     uuid        not null references public.items(id)    on delete cascade,
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  content     text        not null,
  created_at  timestamptz not null default now(),
  constraint comments_content_length_check
    check (char_length(btrim(content)) between 1 and 500)
);

alter table public.comments enable row level security;

-- 누구나 조회 (비로그인 포함)
drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all"
  on public.comments
  for select
  using (true);

-- 본인 명의로만 작성
drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own"
  on public.comments
  for insert
  with check (auth.uid() = user_id);

-- 본인 댓글만 삭제 (update 정책 없음 → 수정은 거부)
drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
  on public.comments
  for delete
  using (auth.uid() = user_id);

-- 매물별 오래된 순(대화 흐름) 조회용 → created_at 은 asc.
create index if not exists idx_comments_item_created
  on public.comments (item_id, created_at);

grant select, insert, delete on public.comments to authenticated;

-- 비로그인 열람용. items·regions 는 01 에서 명시 grant 없이 Supabase 의 public 스키마
-- 기본 권한에 기대고 있지만, 09·12 처럼 의도를 파일에 남긴다(결과는 동일).
grant select on public.comments to anon;


-- =========================================================================
-- 2. item_inquiries.inquiry_type — 'comment' 추가
-- =========================================================================
-- create table if not exists 는 이미 있는 테이블에 아무 것도 하지 않으므로, 제약은
-- 10_delivery_option.sql 과 같이 DROP IF EXISTS 후 재생성한다.
-- 12 에서 create table 안에 인라인으로 선언돼 자동 명명된 이름이
-- item_inquiries_inquiry_type_check 이며, 아래에서 같은 이름으로 다시 만든다.
-- 기존 행은 전부 'phone'/'chat' 이라 새 제약의 기존 데이터 검증을 그대로 통과한다.
alter table public.item_inquiries
  drop constraint if exists item_inquiries_inquiry_type_check;

alter table public.item_inquiries
  add constraint item_inquiries_inquiry_type_check
  check (inquiry_type in ('phone', 'chat', 'comment'));


-- =========================================================================
-- 끝.
-- =========================================================================
