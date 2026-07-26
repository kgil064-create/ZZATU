// 채팅 목록. (Phase 5 · 5-B · Server Component)
//
// requireUser 가드. 내가 참여한 방(buyer 또는 seller)을 last_message_at 최신순으로.
// 각 방: 상대방 닉네임 / 자재 제목·썸네일 / 마지막 메시지 미리보기·시간.

import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { getRoomsWithUnread } from "@/lib/chat";
import { formatRelativeTime } from "@/lib/format";
import { UnreadBadge } from "@/components/unread-badge";

export default async function ChatListPage() {
  const user = await requireUser("/chat");

  // 정렬은 last_message_at 최신순 그대로(미확인 우선 정렬 아님).
  const rooms = await getRoomsWithUnread(user.id);

  return (
    <main className="mx-auto w-full max-w-screen-md px-4 py-4">
      <h1 className="mb-3 text-lg font-semibold text-foreground">채팅</h1>

      {rooms.length === 0 ? (
        <div className="rounded-base border border-border bg-card px-4 py-16 text-center text-sm text-muted-foreground">
          아직 채팅이 없어요
        </div>
      ) : (
        <ul className="space-y-2">
          {rooms.map((room) => {
            const mine = room.buyer_id === user.id;
            const other = mine ? room.seller : room.buyer;
            const thumb = [...(room.items?.item_images ?? [])].sort(
              (a, b) => a.display_order - b.display_order,
            )[0]?.url;
            const last = room.chat_messages[0];
            const preview = last
              ? (last.content ?? (last.image_url ? "사진" : ""))
              : "";
            const hasUnread = room.unreadCount > 0;

            return (
              <li key={room.id}>
                <Link
                  href={`/chat/${room.id}`}
                  className="flex gap-3 rounded-base border border-border bg-card p-3 transition-colors hover:bg-muted"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-base bg-muted">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {other?.nickname ?? "상대방"}
                      </span>
                      {room.last_message_at && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatRelativeTime(room.last_message_at)}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {room.items?.title ?? "자재"}
                    </span>
                    {/* 미확인이 있으면 마지막 메시지를 굵게 + 본문색으로 올린다. */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={
                          "truncate text-sm " +
                          (hasUnread
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground")
                        }
                      >
                        {preview}
                      </span>
                      <UnreadBadge count={room.unreadCount} className="shrink-0" />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
