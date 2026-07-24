"use server";

import { revalidatePath } from "next/cache";

import { COMMENT_MAX_LENGTH } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export interface CommentResult {
  success: boolean;
  error?: string;
}

/**
 * 댓글 작성. (Phase: 댓글)
 *
 * user_id 는 서버의 getUser() 로만 채운다(클라이언트 입력 불신). 길이 검증은
 * DB 의 comments_content_length_check(btrim 기준 1~500자)와 같은 기준으로 미리 거른다.
 * 비로그인은 "unauthenticated" 를 그대로 반환해 클라이언트가 로그인으로 유도한다
 * (revealPhone 과 같은 규약).
 */
export async function createComment(
  itemId: string,
  content: string,
): Promise<CommentResult> {
  const text = content.trim();
  if (!text) return { success: false, error: "댓글을 입력해주세요" };
  if (text.length > COMMENT_MAX_LENGTH) {
    return {
      success: false,
      error: `댓글은 ${COMMENT_MAX_LENGTH}자까지 쓸 수 있어요`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("comments")
    .insert({ item_id: itemId, user_id: user.id, content: text });
  if (error) return { success: false, error: "댓글 등록에 실패했어요" };

  // 문의 기록(comment): 등록에 성공했고 본인 매물이 아닐 때만. 본인 매물 판정은
  // items.user_id 를 직접 조회해서 한다(revealPhone 과 같은 패턴).
  // ⚠️ supabase-js 는 RLS·CHECK 위반에 throw 하지 않고 { error } 를 돌려주므로
  //    error 를 직접 확인해 로그만 남긴다 — 집계 실패가 댓글 등록을 되돌리지는 않는다.
  const { data: item } = await supabase
    .from("items")
    .select("user_id")
    .eq("id", itemId)
    .maybeSingle();
  const ownerId = (item as { user_id: string } | null)?.user_id;
  if (ownerId && ownerId !== user.id) {
    const { error: inquiryError } = await supabase
      .from("item_inquiries")
      .insert({
        item_id: itemId,
        user_id: user.id,
        inquiry_type: "comment",
      });
    if (inquiryError) {
      console.error("[createComment] 문의 기록 실패:", inquiryError.message);
    }
  }

  revalidatePath(`/items/${itemId}`);
  return { success: true };
}

/**
 * 댓글 삭제. (본인 댓글만)
 *
 * RLS(comments_delete_own)가 이미 막지만, UI 숨김을 믿지 않고 서버에서도 작성자를
 * 재검증한다(setItemStatus·deleteItem 과 같은 컨벤션). 수정 기능은 없다 — DB 에
 * update 정책 자체를 두지 않았다.
 *
 * item_inquiries 는 건드리지 않는다: 댓글이 지워져도 "문의가 있었다"는 사실은 남는다.
 */
export async function deleteComment(
  commentId: string,
  itemId: string,
): Promise<CommentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data: comment } = await supabase
    .from("comments")
    .select("user_id")
    .eq("id", commentId)
    .maybeSingle();
  if (!comment) return { success: false, error: "댓글을 찾을 수 없습니다" };
  if ((comment as { user_id: string }).user_id !== user.id) {
    return { success: false, error: "권한이 없습니다" };
  }

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);
  if (error) return { success: false, error: "삭제에 실패했어요" };

  revalidatePath(`/items/${itemId}`);
  return { success: true };
}
