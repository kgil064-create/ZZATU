/**
 * 채팅 관련 클라이언트 헬퍼. (Phase 5 · 5-B)
 */
import { createClient } from "@/lib/supabase/client";

const BUCKET = "chat-images";

/**
 * 채팅 이미지를 chat-images(Private)에 업로드하고 **경로(object key)** 를 반환한다.
 *
 * ⚠️ 경로는 반드시 `{userId}/{roomId}/{파일명}` (3단). chat-images 읽기 정책이 경로의
 * 2번째 폴더 = room_id 로 참여자를 검증하기 때문(item-images 의 2단 규칙과 다름).
 * Private 버킷이라 public URL 은 안 되고, 표시 시 createSignedUrl 로 서명 URL 을 만든다.
 */
export async function uploadChatImage(
  file: File,
  userId: string,
  roomId: string,
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${roomId}/${Date.now()}-${crypto
    .randomUUID()
    .slice(0, 6)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });
  if (error) {
    throw new Error(`사진 업로드 실패: ${error.message}`);
  }
  return path;
}
