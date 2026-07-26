/**
 * 업로드 전 클라이언트 이미지 압축. (브라우저 전용 — 외부 라이브러리 없음)
 *
 * 현장에서 폰으로 찍은 사진은 4000px·3~5MB 급이 흔한데, 목록 썸네일은 96px,
 * 상세 갤러리도 최대 768px 폭이다. 원본을 그대로 올리면 Storage 용량과 목록
 * 로딩 시간을 그대로 낭비하므로, 올리기 직전에 브라우저에서 줄여서 보낸다.
 *
 * 설계 원칙: **압축은 최적화일 뿐 필수 경로가 아니다.** 어떤 이유로든 실패하면
 * 예외를 던지지 않고 원본 File 을 그대로 돌려줘서 업로드 자체는 성공하게 한다.
 */

/** 긴 변 기준 상한. 상세 갤러리 최대 폭(768px)의 2배(레티나) 여유. */
const MAX_EDGE = 1600;
const WEBP_QUALITY = 0.8;
const JPEG_QUALITY = 0.85;

/**
 * MIME → 파일 확장자. 모르는 타입이면 null.
 *
 * 압축하면 포맷이 바뀌므로(jpg → webp) 업로드 파일명을 원본 이름이 아니라
 * 실제 MIME 에서 뽑아야 Storage 의 content-type 과 어긋나지 않는다.
 */
export function extensionForMime(mime: string): string | null {
  switch (mime) {
    case "image/webp":
      return "webp";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    default:
      return null;
  }
}

/** canvas.toBlob 을 프라미스로. 인코딩 실패 시 null. */
function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** 원본 이름의 확장자만 새 MIME 에 맞게 갈아끼운다. (base 이름은 보존) */
function renameToMime(name: string, mime: string): string {
  const ext = extensionForMime(mime);
  if (!ext) return name;
  const base = name.replace(/\.[^./\\]+$/, "");
  return `${base || "photo"}.${ext}`;
}

/**
 * 사진 1장을 긴 변 최대 1600px 로 축소하고 webp(q=0.8)로 다시 인코딩한다.
 *
 * - 원본이 1600px 이하면 **확대하지 않는다**(scale 상한 1).
 * - EXIF 방향은 imageOrientation:"from-image" 로 픽셀에 굽는다. canvas 는 EXIF 를
 *   보존하지 않으므로, 이렇게 하지 않으면 세로로 찍은 사진이 눕는다.
 * - webp 인코딩을 못 하면 jpeg(q=0.85)로 폴백한다.
 * - 결과가 원본보다 크면(이미 잘 압축된 작은 파일) 원본을 그대로 쓴다.
 *
 * @returns 압축된 File, 또는 압축이 불가능·무의미했다면 원본 File
 */
export async function compressImage(file: File): Promise<File> {
  // 서버에서 실수로 불려도 조용히 원본을 돌려준다.
  if (typeof document === "undefined") return file;

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });

    try {
      const scale = Math.min(
        1,
        MAX_EDGE / Math.max(bitmap.width, bitmap.height),
      );
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, width, height);

      // 스펙상 지원하지 않는 타입을 toBlob 에 넘기면 null 이 아니라 image/png 로
      // 되돌아온다 — null 여부만 보면 폴백 판정을 놓치므로 실제 MIME 도 확인한다.
      let blob = await toBlob(canvas, "image/webp", WEBP_QUALITY);
      if (!blob || blob.type !== "image/webp") {
        blob = await toBlob(canvas, "image/jpeg", JPEG_QUALITY);
      }
      if (!blob) return file;

      if (blob.size >= file.size) return file;

      return new File([blob], renameToMime(file.name, blob.type), {
        type: blob.type,
        lastModified: file.lastModified,
      });
    } finally {
      bitmap.close();
    }
  } catch {
    // 디코딩 불가(손상 파일·미지원 포맷)·메모리 부족 등. 원본으로 업로드 진행.
    return file;
  }
}
