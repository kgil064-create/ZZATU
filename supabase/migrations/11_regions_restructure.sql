-- =========================================================================
-- 짜투(ZZATU) — 지역 권역 개편 (regions)
--
-- 목표: 선택 지역을 5개 권역으로 정리한다.
--   제주시 / 서귀포시 / 동부권 / 서부권 / 제주 전체 (이동 가능)
--
-- ⚠️ 스키마 일관성 결정(그룹4 검토): regions 는 (id, si, eupmyeondong, display_order)
--   구조이며, 이미 display_order 로 "정렬"과 "노출 여부(< 100 = 시-단위 노출, >= 100 =
--   1차 읍면동 레거시 숨김)"를 함께 관리해 왔다. 따라서 지시서의 sort_order/is_active 는
--   display_order 와 역할이 중복이라 **새 컬럼을 만들지 않고 display_order 만 사용**한다.
--   실제로 새로 필요한 변경은 si CHECK 확장(east/west)뿐이다.
--
--   - '동부권'/'서부권' 을 si=east/west 로 추가(표시명은 eupmyeondong).
--   - display_order 로 순서 지정: 제주시10·서귀포시20·동부권30·서부권40·제주전체50
--     (모두 < 100 이라 기존 .lt('display_order',100) 노출 규칙에 그대로 편입된다).
--   - '제주 전체' 표시명만 갱신. ⚠️ 행 삭제 금지 — 기존 매물이 region_id 로 참조 중.
--
-- 안전성: 05_phase2_adjustments.sql 과 동일한 멱등 패턴.
--   (constraint DROP/ADD, INSERT ON CONFLICT, 결정적 UPDATE) → 재실행 안전.
--
-- RLS: regions 는 "regions_select_all"(for select using(true)) 공개 읽기이며 컬럼을
--   열거하지 않으므로 정책 변경 불필요.
-- =========================================================================

-- ---------- 1. si CHECK 제약에 east/west 허용 추가 (기존 값 유지) ----------
alter table public.regions
  drop constraint if exists regions_si_check;

alter table public.regions
  add constraint regions_si_check
  check (si in ('jeju', 'seogwipo', 'all', 'east', 'west'));


-- ---------- 2. 신규 권역 행 삽입 (동부권=30, 서부권=40) ----------
-- display_order < 100 이라 기존 노출 규칙에 자동 편입.
insert into public.regions (si, eupmyeondong, display_order)
values
  ('east', '동부권', 30),
  ('west', '서부권', 40)
on conflict (si, eupmyeondong) do nothing;


-- ---------- 3. '제주 전체' 표시명 갱신 + 맨 뒤로(50). 행 삭제 금지. ----------
update public.regions
  set eupmyeondong = '제주 전체 (이동 가능)',
      display_order = 50
  where si = 'all';


-- =========================================================================
-- 끝. 실행 후 노출 지역은 아래 5개(display_order 순, 모두 < 100):
--   10 제주시 / 20 서귀포시 / 30 동부권 / 40 서부권 / 50 제주 전체 (이동 가능)
--   (1차 읍면동 레거시 43행은 display_order >= 100 이라 계속 숨김)
-- =========================================================================
