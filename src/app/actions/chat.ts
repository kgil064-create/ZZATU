"use server";

import { createClient } from "@/lib/supabase/server";

export interface GetOrCreateRoomResult {
  roomId?: string;
  error?: string;
}

/**
 * 자재에 대한 1:1 채팅방을 가져오거나 만든다. (Phase 5 · 5-A)
 *
 * 본인 글이면 거부. (item_id, buyer_id=나) 방이 있으면 그 id, 없으면 생성
 * (seller_id=자재 주인). unique(item_id, buyer_id)가 중복을 막고, 경합으로 insert 가
 * 충돌하면 재조회로 기존 방을 돌려준다.
 */
export async function getOrCreateRoom(
  itemId: string,
): Promise<GetOrCreateRoomResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다" };

  const { data: item } = await supabase
    .from("items")
    .select("user_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return { error: "자재를 찾을 수 없습니다" };

  const sellerId = (item as { user_id: string }).user_id;
  if (sellerId === user.id) {
    return { error: "본인 글에는 채팅할 수 없어요" };
  }

  // 기존 방
  const { data: existing } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("item_id", itemId)
    .eq("buyer_id", user.id)
    .maybeSingle();
  if (existing) return { roomId: (existing as { id: string }).id };

  // 새 방 생성
  const { data: created, error: insertError } = await supabase
    .from("chat_rooms")
    .insert({ item_id: itemId, buyer_id: user.id, seller_id: sellerId })
    .select("id")
    .single();

  if (insertError || !created) {
    // 경합으로 unique 충돌 시 기존 방 재조회
    const { data: retry } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("item_id", itemId)
      .eq("buyer_id", user.id)
      .maybeSingle();
    if (retry) return { roomId: (retry as { id: string }).id };
    return { error: "채팅방을 시작할 수 없어요" };
  }

  return { roomId: (created as { id: string }).id };
}

export interface SendMessageResult {
  success: boolean;
  error?: string;
}

/**
 * 텍스트 메시지 전송. (Phase 5 · 5-A — 사진은 5-B)
 *
 * 참여자 확인은 chat_rooms select RLS(참여자만 조회)로 처리한다(없으면 권한 없음).
 * 메시지 insert 후 방의 last_message_at 을 갱신해 목록 정렬에 쓴다.
 */
export async function sendMessage(
  roomId: string,
  content: string,
): Promise<SendMessageResult> {
  const text = content.trim();
  if (!text) return { success: false, error: "메시지를 입력해주세요" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  // RLS 가 참여자 방만 돌려준다.
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("id", roomId)
    .maybeSingle();
  if (!room) return { success: false, error: "권한이 없습니다" };

  const { error: messageError } = await supabase
    .from("chat_messages")
    .insert({ room_id: roomId, sender_id: user.id, content: text });
  if (messageError) return { success: false, error: "전송에 실패했어요" };

  await supabase
    .from("chat_rooms")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", roomId);

  return { success: true };
}
