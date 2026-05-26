-- =========================================================================
-- 짜투(ZZATU) 2차 MVP — 초기 데이터(seed)
-- 카테고리·운반옵션·제주도 읍면동 마스터 데이터를 채워넣습니다.
-- =========================================================================

-- ---------- 1. 카테고리 (10개) ----------
insert into public.categories (code, name, display_order) values
  ('structure',   '골조·구조',   10),
  ('plumbing',    '배관·설비',   20),
  ('electric',    '전기·조명',   30),
  ('insulation',  '단열·방수',   40),
  ('window_door', '창호·문',     50),
  ('finishing',   '마감재',      60),
  ('bath_kitchen','욕실·주방',   70),
  ('exterior',    '외장·조경',   80),
  ('tool',        '공구·장비',   90),
  ('etc',         '기타',        99)
on conflict (code) do nothing;


-- ---------- 2. 운반 옵션 (5개) ----------
insert into public.transport_options (code, name, display_order) values
  ('1ton',     '1톤트럭',         10),
  ('2_5ton',   '2.5톤트럭',       20),
  ('5ton',     '5톤트럭',         30),
  ('forklift', '지게차 필요',     40),
  ('pickup',   '직접 픽업 가능',  50)
on conflict (code) do nothing;


-- ---------- 3. 제주시 읍면동 (26개) ----------
insert into public.regions (si, eupmyeondong, display_order) values
  -- 읍면
  ('jeju', '한림읍',   110),
  ('jeju', '애월읍',   120),
  ('jeju', '구좌읍',   130),
  ('jeju', '조천읍',   140),
  ('jeju', '한경면',   150),
  ('jeju', '추자면',   160),
  ('jeju', '우도면',   170),
  -- 동
  ('jeju', '일도1동',  210),
  ('jeju', '일도2동',  220),
  ('jeju', '이도1동',  230),
  ('jeju', '이도2동',  240),
  ('jeju', '삼도1동',  250),
  ('jeju', '삼도2동',  260),
  ('jeju', '용담1동',  270),
  ('jeju', '용담2동',  280),
  ('jeju', '건입동',   290),
  ('jeju', '화북동',   300),
  ('jeju', '삼양동',   310),
  ('jeju', '봉개동',   320),
  ('jeju', '아라동',   330),
  ('jeju', '오라동',   340),
  ('jeju', '연동',     350),
  ('jeju', '노형동',   360),
  ('jeju', '외도동',   370),
  ('jeju', '이호동',   380),
  ('jeju', '도두동',   390)
on conflict (si, eupmyeondong) do nothing;


-- ---------- 4. 서귀포시 읍면동 (17개) ----------
insert into public.regions (si, eupmyeondong, display_order) values
  -- 읍면
  ('seogwipo', '대정읍', 110),
  ('seogwipo', '남원읍', 120),
  ('seogwipo', '성산읍', 130),
  ('seogwipo', '안덕면', 140),
  ('seogwipo', '표선면', 150),
  -- 동
  ('seogwipo', '송산동', 210),
  ('seogwipo', '정방동', 220),
  ('seogwipo', '중앙동', 230),
  ('seogwipo', '천지동', 240),
  ('seogwipo', '효돈동', 250),
  ('seogwipo', '영천동', 260),
  ('seogwipo', '동홍동', 270),
  ('seogwipo', '서홍동', 280),
  ('seogwipo', '대륜동', 290),
  ('seogwipo', '대천동', 300),
  ('seogwipo', '중문동', 310),
  ('seogwipo', '예래동', 320)
on conflict (si, eupmyeondong) do nothing;


-- =========================================================================
-- 끝. DB 초기 셋업 완료.
-- 다음 단계: Supabase Storage 버킷 생성 (자재 사진·채팅 이미지 저장용)
--   - 버킷명: 'item-images' (public read)
--   - 버킷명: 'chat-images' (인증된 사용자만 read)
-- 이건 Supabase 대시보드의 Storage 메뉴에서 GUI 로 만들면 됩니다.
-- =========================================================================
