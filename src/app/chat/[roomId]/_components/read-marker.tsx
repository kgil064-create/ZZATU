"use client";

import { useEffect } from "react";

import { markRoomRead } from "@/app/actions/chat";
import { createClient } from "@/lib/supabase/client";

/**
 * 방 읽음 처리기. 렌더 결과 없음(null).
 *
 * ① 마운트 시 1회 — 방에 들어온 시점까지를 읽음으로 표시.
 * ② 머무는 동안 상대 메시지가 도착할 때마다 다시 — 이게 없으면 방에 있는 사이 온
 *    메시지가 방을 나간 뒤 미확인으로 남는다.
 * ③ 단, ②는 **화면이 실제로 보일 때만**. 탭이 백그라운드거나 화면이 꺼진 상태에서
 *    온 메시지까지 읽음 처리하면 사용자는 못 본 메시지가 읽음으로 사라진다.
 * ④ 숨김 → 보임으로 돌아오면 그 사이 쌓인 메시지를 그때 한 번에 읽음 처리한다.
 *
 * MessageThread 와 별개의 채널(room-read:*)을 쓴다. 메시지 상태를 페이지로 끌어올려
 * 두 컴포넌트를 얽는 대신 읽음 처리를 이 파일 안에서 자족적으로 끝내려는 선택 —
 * 대신 방 하나당 Realtime 구독이 2개가 된다.
 *
 * 전부 fire-and-forget: 실패해도 채팅 동작을 막지 않는다.
 */
export function RoomReadMarker({
  roomId,
  myId,
}: {
  roomId: string;
  myId: string;
}) {
  useEffect(() => {
    // 진입 시점은 화면이 보이는 상태이므로 그대로 1회 호출.
    void markRoomRead(roomId).catch(() => {});

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    /** 화면이 보일 때만 읽음 처리. 숨김 상태면 아무것도 하지 않는다. */
    function markIfVisible() {
      if (document.visibilityState !== "visible") return;
      void markRoomRead(roomId).catch(() => {});
    }

    // visibilitychange 는 숨김·보임 양쪽에서 발생한다. 위 가드가 있어
    // "보임으로 전환된 순간"에만 실제 호출로 이어진다.
    document.addEventListener("visibilitychange", markIfVisible);

    (async () => {
      // Realtime 도 유저 JWT 로 인증해야 RLS 를 통과해 이벤트가 온다(MessageThread 와 동일).
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel(`room-read:${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            // 내가 보낸 메시지는 갱신할 필요가 없다(애초에 미확인으로 안 잡힌다).
            const msg = payload.new as { sender_id?: string };
            if (msg.sender_id === myId) return;
            markIfVisible();
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", markIfVisible);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [roomId, myId]);

  return null;
}
