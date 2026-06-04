"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  sent_at: string;
}

/**
 * 메시지 목록 + Realtime 구독. (Phase 5 · 5-A)
 *
 * 초기 메시지를 서버에서 받아 표시하고, 이 방의 chat_messages INSERT 를 구독해 새 메시지를
 * append 한다(RLS 적용 — 내 방 메시지만 옴). 내/상대 말풍선을 좌우로 구분한다.
 */
export function MessageThread({
  roomId,
  myId,
  initialMessages,
}: {
  roomId: string;
  myId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      // ① Realtime 를 유저 JWT 로 인증해야 postgres_changes 의 RLS 가 통과한다.
      //    (익명 키로 붙으면 auth.uid() 가 null → 이벤트가 안 옴)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);

      // ② 이 방의 INSERT 만 구독
      channel = supabase
        .channel(`room:${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            // ③ 새 메시지 append (id 중복 방지)
            const msg = payload.new as ChatMessage;
            setMessages((prev) =>
              prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
            );
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 space-y-2 overflow-y-auto py-2">
      {messages.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          아직 메시지가 없어요. 먼저 인사를 건네보세요.
        </p>
      ) : (
        messages.map((m) => {
          const mine = m.sender_id === myId;
          return (
            <div
              key={m.id}
              className={"flex " + (mine ? "justify-end" : "justify-start")}
            >
              <div
                className={
                  "max-w-[75%] rounded-base px-3 py-2 text-sm " +
                  (mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground")
                }
              >
                {m.content && (
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                )}
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
