/**
 * Supabase Storage 헬퍼.
 *
 * 자재 사진은 폼(client component)에서 직접 업로드하므로 브라우저 클라이언트를
 * 쓴다. 버킷 `item-images` 는 Public 으로 설정돼 있어 getPublicUrl 로 바로
 * 접근 가능한 URL 을 얻는다.
 */
import { createClient } from "@/lib/supabase/client";

const BUCKET = "item-images";

/**
 * 사진 1장을 Storage 에 올리고 public URL 을 돌려준다.
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

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${userId}/${Date.now()}-${crypto
    .randomUUID()
    .slice(0, 6)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, { upsert: false });

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
