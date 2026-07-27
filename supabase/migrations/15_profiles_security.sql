-- =========================================================================
-- 15. profiles 보안 강화 — 컬럼 레벨 권한으로 UPDATE·SELECT 최소화
-- 01~14 이후 실행.
--
-- 이 마이그레이션 후의 최종 상태:
--   · 본인이든 타인이든 profiles 에서 읽히는 컬럼은 **id · nickname 뿐**이다.
--   · email · phone · kakao_id · is_suspended · business_name ·
--     notification_consent · created_at · last_login_at 은
--     **anon · authenticated 양쪽에서 조회 불가**.
--   · UPDATE 는 **nickname 만** 가능하다(그것도 본인 행만).
--
-- 배경: 02_setup_rls.sql 의 profiles 정책은 **행**만 다룬다.
--   profiles_update_own → 본인 행만, 그러나 컬럼 제한 없음
--   profiles_select_all → using (true), 즉 모든 행이 모든 컬럼과 함께 공개
--   PostgreSQL 의 RLS 는 행 단위 기능이라 정책만으로는 컬럼을 가릴 수 없다. 그래서
--   지금은 anon 키만으로 전 회원의 email·phone·kakao_id 를 긁을 수 있고, 로그인
--   사용자는 본인 행의 is_suspended(정지 자가 해제)·kakao_id(계정 식별자 위조) 등을
--   직접 UPDATE 할 수 있다.
--
-- 해결: 컬럼 레벨 GRANT. RLS(행) 와 GRANT(컬럼) 를 겹쳐서 좁힌다. 두 겹 중 하나라도
--   빠지면 뚫리므로 기존 정책은 **그대로 둔다**(이 파일은 정책을 만들거나 지우지 않는다).
--     · profiles_update_own (RLS)      → 어느 행을  : 본인 행만
--     · grant update (nickname)        → 어느 컬럼을: nickname 만
--     · profiles_select_all (RLS)      → 어느 행을  : 전부(댓글·채팅에 닉네임 표시 필요)
--     · grant select (id, nickname)    → 어느 컬럼을: id·nickname 만
--
-- ⚠️ 한계(설계상 불가): "본인 행은 전체 컬럼, 타인 행은 id·nickname" 은 단일 테이블에서
--    표현할 수 없다. 컬럼 권한은 행과 무관하게 적용되고 RLS 는 컬럼을 거르지 못하기
--    때문이다(정책을 본인/타인으로 쪼개도 컬럼 보호는 생기지 않는다). 앱이 현재
--    nickname 외의 컬럼을 어디서도 읽지 않아 지금은 잃는 기능이 없다. 훗날 본인
--    전체 프로필이 필요해지면 security definer 함수(get_my_profile) 또는
--    `where id = auth.uid()` 를 박은 뷰를 추가하는 쪽으로 푼다 — 08 의 delete_user(),
--    14 의 mark_room_read() 와 같은 패턴.
--
-- ⚠️ 남는 리스크: 행은 여전히 전부 공개라 anon 이 전 회원의 (id, nickname) 목록을
--    열거하는 것 자체는 막히지 않는다. 닉네임은 공개 댓글·채팅에 노출되는 값이라
--    행을 좁히려면 조회 구조를 바꿔야 해서, 이번에는 노출 범위를 닉네임까지로
--    줄이는 선에서 멈춘다.
--
-- 멱등성: 각 섹션이 revoke → grant 순서다. REVOKE 는 테이블 레벨 권한을 지울 때 해당
--   테이블의 컬럼 레벨 권한도 함께 지우므로, 몇 번을 재실행해도 "테이블 전체 권한" 이
--   되살아나지 않고 항상 아래의 최소 권한으로 수렴한다.
-- =========================================================================


-- ---------- 1. UPDATE — nickname 컬럼만 ----------
-- ⚠️ 순서 중요: 테이블 레벨 권한이 남아 있으면 컬럼 레벨 GRANT 를 추가해도 무의미하다
--    (테이블 레벨이 이미 모든 컬럼을 허용하므로 넓은 쪽이 이긴다). 반드시 먼저 회수.
revoke update on public.profiles from authenticated;

-- anon 은 애초에 profiles_update_own(id = auth.uid()) 을 통과할 수 없지만
-- (비로그인이면 auth.uid() 가 null), 권한 자체를 남겨둘 이유가 없어 함께 회수한다.
revoke update on public.profiles from anon;

-- 이제 authenticated 가 nickname 외 컬럼을 UPDATE 하려 하면 RLS 이전 단계에서
-- "permission denied for column ..." 으로 거부된다. anon 에게는 아무것도 주지 않는다.
grant update (nickname) on public.profiles to authenticated;


-- ---------- 2. SELECT — id · nickname 컬럼만 ----------
-- 1번과 같은 이유로 테이블 레벨을 먼저 회수한다.
revoke select on public.profiles from anon, authenticated;

-- ⚠️ id 를 반드시 포함해야 한다. 화면에 그리지 않더라도 아래 세 곳이 id 를 읽는다:
--    · 조인 키   — 댓글 `profiles(nickname)`, 채팅 `profiles!buyer_id(nickname)` 의
--                  임베드가 profiles.id 로 조인한다.
--    · 필터      — getProfile()·마이페이지의 `.eq("id", user.id)`.
--    · UPDATE WHERE — updateNickname 의 `.eq("id", user.id)`. PostgreSQL 은 UPDATE 의
--                  WHERE 에서 읽는 컬럼에도 SELECT 권한을 요구하므로, id 를 빼면
--                  1번에서 살려둔 닉네임 수정이 여기서 깨진다.
-- anon 도 포함한다 — 매물 상세의 댓글은 비로그인에게도 공개(comments_select_all)라
-- 작성자 닉네임을 anon 이 읽을 수 있어야 한다.
grant select (id, nickname) on public.profiles to anon, authenticated;


-- ---------- 3. 기존 기능 영향 검증 메모 ----------
-- 아래는 src 전체를 훑어 확인한 profiles 접근 지점 전부다. 모두 id·nickname 만 쓴다.
--
-- [읽기]
--  · src/lib/auth.ts (getProfile)      : .select("nickname").eq("id", user.id)
--  · src/app/mypage/page.tsx           : .select("nickname").eq("id", user.id)
--  · src/app/items/[id]/page.tsx       : comments ... profiles(nickname)   (임베드)
--  · src/lib/chat.ts                   : profiles!buyer_id(nickname),
--                                        profiles!seller_id(nickname)      (임베드)
--   → email·phone·business_name·kakao_id 를 읽는 코드는 **존재하지 않는다**.
--     마이페이지도 닉네임만 표시한다. 매물 상세의 전화번호는 items.contact_phone
--     (다른 테이블) 이고 src/app/actions/items.ts 가 따로 가져온다 — profiles 무관.
--   → select("*") 로 profiles 를 읽는 곳도 없다(있다면 이 마이그레이션 후 깨진다).
--
-- [쓰기]
--  · src/app/actions/profile.ts (updateNickname) 가 유일하다.
--      .from("profiles").update({ nickname }).eq("id", user.id)
--    갱신 컬럼이 nickname 하나뿐이라 1번을 통과하고, .select() 를 체이닝하지 않아
--    PostgREST 가 Prefer: return=minimal 로 보내 RETURNING 절이 없다 → 응답을 위한
--    추가 컬럼 권한이 필요하지 않다. WHERE 의 id 는 2번에서 SELECT 권한을 부여했다.
--
-- [권한 회수와 무관하게 계속 동작하는 것]
--  · handle_new_user 트리거(02) : security definer → 소유자 권한으로 INSERT.
--  · delete_user() RPC(08)      : security definer → 탈퇴 시 profiles 연쇄 삭제.
--  · service_role · postgres(테이블 소유자) : 이 revoke 의 대상이 아니다.
--  · RLS 정책식(id = auth.uid()) : 정책 평가에는 호출자의 컬럼 권한이 필요 없다.
--
-- ⚠️ 향후 주의: Supabase 의 public 스키마 기본 권한(alter default privileges) 이나
--    대시보드에서 테이블 권한을 다시 부여하면 이 제한이 통째로 풀린다. 스키마를 만지는
--    작업 뒤에는 아래로 재확인할 것.
--      select grantee, privilege_type, column_name
--        from information_schema.column_privileges
--       where table_schema = 'public' and table_name = 'profiles'
--       order by grantee, privilege_type, column_name;
--      select grantee, privilege_type
--        from information_schema.table_privileges
--       where table_schema = 'public' and table_name = 'profiles';
--    기대값: column_privileges 에 (anon|authenticated, SELECT, id|nickname) 과
--            (authenticated, UPDATE, nickname) 만, table_privileges 에는 anon·
--            authenticated 행이 남지 않는다.

-- =========================================================================
-- 끝.
-- =========================================================================
