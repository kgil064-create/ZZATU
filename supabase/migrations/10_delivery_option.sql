-- =========================================================================
-- 짜투(ZZATU) — 배송 여부(delivery_option) 컬럼 추가
--
-- items 에 delivery_option 을 추가한다.
--   - nullable (미선택 허용, 기본값 없음)
--   - 허용값: 'available' | 'unavailable' | 'negotiable'  (CHECK 제약)
--
-- 안전성: 05_phase2_adjustments.sql 과 동일하게 멱등 패턴을 지킨다.
--   (ADD COLUMN IF NOT EXISTS + 제약은 DROP IF EXISTS 후 재생성)
--   → 이미 적용된 라이브 DB 에서 다시 실행해도 에러 없이 통과한다.
--
-- RLS: items 정책(select_all / insert_own / update_own / delete_own)은 모두
--   행(row) 단위이며 컬럼을 열거하지 않으므로, 새 컬럼에 대한 정책 변경은 불필요하다.
-- =========================================================================

-- ---------- 1. 컬럼 추가 ----------
alter table public.items
  add column if not exists delivery_option text;

-- ---------- 2. CHECK 제약 (멱등: 있으면 지우고 다시 추가) ----------
alter table public.items
  drop constraint if exists items_delivery_option_check;

alter table public.items
  add constraint items_delivery_option_check
  check (
    delivery_option is null
    or delivery_option in ('available', 'unavailable', 'negotiable')
  );
