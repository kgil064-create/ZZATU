/**
 * 채팅 조회 헬퍼. (서버 전용 — next/headers 에 의존)
 *
 * ⚠️ 이 파일은 클라이언트 컴포넌트에서 import 하면 빌드가 깨진다.
 *    브라우저에서 쓰는 채팅 이미지 업로드는 lib/storage.ts 로 옮겼다.
 *
 * 미확인 판정 규칙(단일 소스):
 *   "내가 참여한 방에서, 내가 보내지 않았고(sender_id != me),
 *    내 last_read_at 이후에 도착한(sent_at > last_read_at) 메시지"
 *   last_read_at 이 null 이면 그 방은 한 번도 읽지 않은 것 → 전부 미확인.
 */
import { createClient } from "@/lib/supabase/server";

/** 미확인 계산에 필요한 방 최소 정보. */
export interface ChatRoomReadState {
  id: string;
  buyer_id: string;
  seller_id: string;
  buyer_last_read_at: string | null;
  seller_last_read_at: string | null;
}

/** 채팅 목록 한 줄에 필요한 방 정보 + 내 미확인 개수. */
export interface ChatListRoom extends ChatRoomReadState {
  last_message_at: string | null;
  buyer: { nickname: string } | null;
  seller: { nickname: string } | null;
  items: {
    title: string;
    item_images: { url: string; display_order: number }[];
  } | null;
  chat_messages: {
    content: string | null;
    image_url: string | null;
    sent_at: string;
  }[];
  unreadCount: number;
}

/** 내 기준 이 방의 마지막 읽음 시각. 참여자가 아니면 seller 쪽으로 떨어지지만
 *  애초에 RLS 가 내 방만 돌려주므로 그런 방은 오지 않는다. */
function myLastReadAt(room: ChatRoomReadState, userId: string): string | null {
  return room.buyer_id === userId
    ? room.buyer_last_read_at
    : room.seller_last_read_at;
}

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/** 방 1개의 미확인 개수. head+count 라 행 본문은 받지 않는다. */
async function countRoomUnread(
  supabase: ServerClient,
  room: ChatRoomReadState,
  userId: string,
): Promise<number> {
  const lastRead = myLastReadAt(room, userId);

  let query = supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("room_id", room.id)
    .neq("sender_id", userId);

  // null 이면 시각 조건을 걸지 않는다 = 이 방 전체가 미확인.
  if (lastRead) query = query.gt("sent_at", lastRead);

  const { count } = await query;
  return count ?? 0;
}

/**
 * 헤더 배지용 — 내 모든 방의 미확인 메시지 총 개수.
 *
 * 방 목록을 받아 방마다 count 쿼리를 던진다(방 수가 적어 그대로 둔다).
 * 방이 0개면 쿼리를 추가로 던지지 않는다.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();

  // RLS(chat_rooms_select_participant) 가 내가 참여한 방만 돌려준다.
  const { data } = await supabase
    .from("chat_rooms")
    .select("id, buyer_id, seller_id, buyer_last_read_at, seller_last_read_at");
  const rooms = (data ?? []) as unknown as ChatRoomReadState[];
  if (rooms.length === 0) return 0;

  const counts = await Promise.all(
    rooms.map((room) => countRoomUnread(supabase, room, userId)),
  );
  return counts.reduce((sum, n) => sum + n, 0);
}

/**
 * 채팅 목록용 — 기존 /chat 쿼리 + 방별 미확인 개수.
 *
 * 정렬은 기존 그대로 last_message_at 최신순(미확인 우선 정렬로 바꾸지 않는다).
 */
export async function getRoomsWithUnread(
  userId: string,
): Promise<ChatListRoom[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("chat_rooms")
    .select(
      "id, buyer_id, seller_id, last_message_at, buyer_last_read_at, seller_last_read_at, buyer:profiles!buyer_id(nickname), seller:profiles!seller_id(nickname), items(title, item_images(url, display_order)), chat_messages(content, image_url, sent_at)",
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("sent_at", { referencedTable: "chat_messages", ascending: false })
    .limit(1, { referencedTable: "chat_messages" });

  const rooms = (data ?? []) as unknown as Omit<ChatListRoom, "unreadCount">[];
  if (rooms.length === 0) return [];

  const counts = await Promise.all(
    rooms.map((room) => countRoomUnread(supabase, room, userId)),
  );
  return rooms.map((room, i) => ({ ...room, unreadCount: counts[i] }));
}
