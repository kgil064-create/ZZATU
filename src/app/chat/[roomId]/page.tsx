// 채팅방. (Phase 5 · 5-A · Server Component)
//
// requireUser 가드. 방은 RLS(참여자만 select)로 가져오므로, 참여자가 아니거나 없는 방이면
// 조회 결과가 null → notFound() 로 차단. 초기 메시지를 로드해 thread/input 에 넘긴다.

import { notFound } from "next/navigation";
import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  MessageThread,
  type ChatMessage,
} from "./_components/message-thread";
import { MessageInput } from "./_components/message-input";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const user = await requireUser(`/chat/${roomId}`);
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, item_id, items(title)")
    .eq("id", roomId)
    .maybeSingle();
  if (!room) notFound(); // 참여자 아님(RLS) 또는 없는 방

  const typedRoom = room as unknown as {
    item_id: string;
    items: { title: string } | null;
  };

  const { data: messagesData } = await supabase
    .from("chat_messages")
    .select("id, room_id, sender_id, content, image_url, sent_at")
    .eq("room_id", roomId)
    .order("sent_at", { ascending: true });
  const initialMessages = (messagesData ?? []) as unknown as ChatMessage[];

  return (
    <main className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-screen-md flex-col px-4 py-3">
      <div className="mb-1 border-b border-border pb-2">
        <Link
          href={`/items/${typedRoom.item_id}`}
          className="truncate text-sm font-medium text-foreground hover:underline"
        >
          {typedRoom.items?.title ?? "자재"}
        </Link>
      </div>

      <MessageThread
        roomId={roomId}
        myId={user.id}
        initialMessages={initialMessages}
      />
      <MessageInput roomId={roomId} />
    </main>
  );
}
