/**
 * Supabase Storage 헬퍼. (브라우저 전용 — 클라이언트 컴포넌트에서 직접 호출)
 *
 * 자재 사진은 폼(client component)에서 직접 업로드하므로 브라우저 클라이언트를
 * 쓴다. 버킷 `item-images` 는 Public 으로 설정돼 있어 getPublicUrl 로 바로
 * 접근 가능한 URL 을 얻는다.
 *
 * 채팅 이미지 업로드(uploadChatImage)도 여기 있다 — 원래 lib/chat.ts 에 있었지만,
 * chat.ts 가 서버 전용(next/headers) 조회 모듈이 되면서 브라우저에서 import 할 수
 * 없게 돼 같은 성격의 업로드 헬퍼끼리 모았다.
 */
import { compressImage, extensionForMime } from "@/lib/image-compress";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "item-images";
const CHAT_BUCKET = "chat-images";

/**
 * 사진 1장을 Storage 에 올리고 public URL 을 돌려준다.
 *
 * 업로드 직전에 브라우저에서 리사이즈·압축한다(compressImage). 압축이 실패하면
 * 원본 File 이 그대로 돌아오므로 업로드는 어떤 경우에도 계속 진행된다.
 *
 * 파일명은 `{userId}/{timestamp}-{random}.{ext}` 패턴으로 만들어 충돌을 막고
 * timestamp 로 자연 정렬되게 한다. 업로드 실패 시 어떤 파일이 실패했는지
 * 포함한 에러를 throw 하므로 호출자가 잡아서 처리한다.
 */
export async function uploadItemPhoto(
  file: File,
  userId: string,
): Promise<string> {
  const supabase = createClient();

  const upload = await compressImage(file);

  // 확장자는 원본 이름이 아니라 압축 결과의 실제 MIME 에서 뽑는다 — 압축으로
  // 포맷이 바뀌므로(jpg → webp) 이름만 믿으면 content-type 과 어긋난다.
  // MIME 을 못 알아보는 경우에만 기존처럼 파일명 확장자로 폴백.
  const ext =
    extensionForMime(upload.type) ??
    upload.name.split(".").pop()?.toLowerCase() ??
    "jpg";
  const filename = `${userId}/${Date.now()}-${crypto
    .randomUUID()
    .slice(0, 6)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, upload, { upsert: false, contentType: upload.type });

  if (uploadError) {
    throw new Error(`사진 업로드 실패: ${file.name} - ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * public URL 로부터 Storage 파일을 삭제한다. (DB 저장 실패 시 고아 파일 정리용)
 *
 * publicUrl 예:
 *   https://xxx.supabase.co/storage/v1/object/public/item-images/userId/123-abc.jpg
 *   → 추출 경로: userId/123-abc.jpg
 * 경로를 못 뽑으면 조용히 무시한다(정리 실패가 본 흐름을 막지 않도록).
 */
export async function deleteStoragePhoto(publicUrl: string): Promise<void> {
  const supabase = createClient();
  const match = publicUrl.match(/item-images\/(.+)$/);
  if (!match) return;
  await supabase.storage.from(BUCKET).remove([match[1]]);
}

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
    .from(CHAT_BUCKET)
    .upload(path, file, { upsert: false });
  if (error) {
    throw new Error(`사진 업로드 실패: ${error.message}`);
  }
  return path;
}
