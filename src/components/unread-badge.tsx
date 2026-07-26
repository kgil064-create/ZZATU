import { UNREAD_BADGE_MAX, UNREAD_BADGE_STYLE } from "@/lib/constants";

/**
 * 채팅 미확인 개수 배지. 헤더 아이콘·채팅 목록이 함께 쓴다.
 *
 * 0(이하)이면 아무것도 렌더하지 않는다 — 호출부에서 조건 렌더를 따로 하지 않아도
 * 안전하도록 여기서 막는다. 99 초과는 "99+".
 * 색은 UNREAD_BADGE_STYLE 단일 소스(브랜드색·거래유형색과 무관한 알림 전용 값).
 */
export function UnreadBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;

  const label = count > UNREAD_BADGE_MAX ? `${UNREAD_BADGE_MAX}+` : String(count);

  return (
    <span
      aria-label={`읽지 않은 메시지 ${label}개`}
      className={
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold leading-none " +
        (className ?? "")
      }
      style={{
        backgroundColor: UNREAD_BADGE_STYLE.bg,
        color: UNREAD_BADGE_STYLE.text,
      }}
    >
      {label}
    </span>
  );
}
