-- =========================================================================
-- 짜투(ZZATU) — 회원 탈퇴(자기 계정 삭제) 함수  [Phase: 탈퇴]
-- 01~07 이후 실행. service role 키 없이 본인이 자기 계정을 삭제할 수 있게 한다.
--
-- 보안: SECURITY DEFINER 로 (함수 소유자=postgres 권한으로) auth.users 를 삭제하되,
--   where 절이 auth.uid() 라 호출자 본인 행만 지워진다(권한 상승 위험 없음).
-- 연쇄 삭제: auth.users 삭제 → profiles → items/chat_rooms/... 까지 전부 FK ON DELETE
--   CASCADE 로 자동 정리된다(01·05·06 실측 확인). Storage 객체는 cascade 안 되므로
--   앱의 Server Action(withdrawAccount)에서 별도 정리한다.
--
-- 멱등성: create or replace + grant(재실행 안전).
-- =========================================================================

create or replace function public.delete_user()
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.users where id = auth.uid();
$$;

grant execute on function public.delete_user() to authenticated;

-- =========================================================================
-- 끝.
-- =========================================================================
