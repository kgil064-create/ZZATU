"use client";

/**
 * 자재 등록 폼(create). 공유 ItemForm 의 얇은 래퍼. (Phase 3 · 묶음 5 리팩터)
 *
 * 필드·검증·레이아웃은 ItemForm 단일 소스. 여기선 등록용 영속화만 주입한다:
 * 신규 사진을 Storage 에 업로드 → createItem 호출 → 실패 시 올린 사진 정리 → 성공 시 상세로 이동.
 */

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { uploadItemPhoto, deleteStoragePhoto } from "@/lib/storage";
import { createItem } from "@/app/actions/items";
import {
  ItemForm,
  type Category,
  type Region,
  type TransportOption,
} from "./_components/item-form";

// page.tsx 가 마스터 데이터 캐스팅에 쓰므로 타입을 그대로 재노출한다.
export type { Category, Region, TransportOption };

export type NewItemFormProps = {
  categories: Category[];
  regions: Region[];
  transportOptions: TransportOption[];
};

export function NewItemForm({
  categories,
  regions,
  transportOptions,
}: NewItemFormProps) {
  const router = useRouter();

  return (
    <ItemForm
      categories={categories}
      regions={regions}
      transportOptions={transportOptions}
      submitLabel="등록"
      onSubmit={async ({ data, photos, setPhase }) => {
        setPhase("uploading");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { error: "로그인이 필요합니다" };

        // 등록은 모든 사진이 신규(new). 병렬 업로드.
        const newPhotos = photos.filter((p) => p.kind === "new");
        let photoUrls: string[] = [];
        if (newPhotos.length > 0) {
          photoUrls = await Promise.all(
            newPhotos.map((p) =>
              p.kind === "new"
                ? uploadItemPhoto(p.file, user.id)
                : Promise.resolve(""),
            ),
          );
        }

        setPhase("saving");
        const res = await createItem({ ...data, photo_urls: photoUrls });
        if (!res.success) {
          // 저장 실패 → 방금 올린 사진 정리(고아 파일 방지)
          if (photoUrls.length > 0) {
            await Promise.allSettled(
              photoUrls.map((url) => deleteStoragePhoto(url)),
            );
          }
          return { error: res.error || "등록에 실패했습니다" };
        }

        // 성공 → previewUrl 회수 후 상세로 이동
        photos.forEach((p) => {
          if (p.kind === "new") URL.revokeObjectURL(p.previewUrl);
        });
        router.push(`/items/${res.itemId}`);
      }}
    />
  );
}
