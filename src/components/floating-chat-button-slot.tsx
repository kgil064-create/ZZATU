import { Suspense } from "react";

import { getCachedUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/chat";
import { FloatingChatButton } from "@/components/floating-chat-button";

/**
 * 채팅 FAB + 미확인 개수 조회를 잇는 서버 컴포넌트.
 *
 * FloatingChatButton 은 usePathname 을 쓰는 클라이언트 컴포넌트라 스스로 DB 를
 * 조회할 수 없다. 배지 하나 때문에 서버/클라이언트 경계를 옮기지 않고, 조회는
 * 여기서 하고 숫자만 prop 으로 내린다.
 */
async function FloatingChatButtonWithUnread() {
  const user = await getCachedUser();

  // 비로그인이면 조회 자체를 하지 않는다.
  const unreadCount = user ? await getUnreadCount(user.id) : 0;

  return <FloatingChatButton unreadCount={unreadCount} />;
}

/**
 * 루트 레이아웃이 쓰는 진입점.
 *
 * 미확인 조회를 Suspense 로 끊는다 — 이게 없으면 레이아웃 셸 전체가 채팅 카운트
 * 쿼리를 기다린다. fallback 은 개수 0(배지 없음) 상태의 같은 FAB 이라, 버튼은
 * 즉시 뜨고 배지만 뒤늦게 채워진다(위치·크기가 같아 시프트 없음).
 */
export function FloatingChatButtonSlot() {
  return (
    <Suspense fallback={<FloatingChatButton unreadCount={0} />}>
      <FloatingChatButtonWithUnread />
    </Suspense>
  );
}
