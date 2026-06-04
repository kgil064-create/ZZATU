"use client";

/**
 * 자재 수정 폼(edit). 공유 ItemForm 의 얇은 래퍼. (Phase 3 · 묶음 5)
 *
 * 필드·검증·레이아웃은 ItemForm 단일 소스. 여기선 수정용 영속화만 주입한다:
 * 신규 사진만 Storage 업로드 → 화면 순서대로 최종 URL 리스트 구성(기존 url + 업로드 url)
 * → updateItem 호출(서버에서 사진 diff 동기화) → 성공 시 상세로 이동.
 */

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { uploadItemPhoto, deleteStoragePhoto } from "@/lib/storage";
import { updateItem } from "@/app/actions/items";
import {
  ItemForm,
  type Category,
  type ItemFormValues,
  type Region,
  type TransportOption,
} from "../../new/_components/item-form";

// edit/page.tsx 가 prefill·캐스팅에 쓰므로 타입을 재노출한다.
export type { Category, Region, TransportOption, ItemFormValues };

export interface EditItemFormProps {
  itemId: string;
  categories: Category[];
  regions: Region[];
  transportOptions: TransportOption[];
  initialValues: Partial<ItemFormValues>;
}

export function EditItemForm({
  itemId,
  categories,
  regions,
  transportOptions,
  initialValues,
}: EditItemFormProps) {
  const router = useRouter();

  return (
    <ItemForm
      categories={categories}
      regions={regions}
      transportOptions={transportOptions}
      initialValues={initialValues}
      submitLabel="수정"
      onSubmit={async ({ data, photos, setPhase }) => {
        setPhase("uploading");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { error: "로그인이 필요합니다" };

        // 신규 사진만 업로드. id → 업로드된 URL 매핑.
        const uploadedById = new Map<string, string>();
        await Promise.all(
          photos.map(async (p) => {
            if (p.kind === "new") {
              uploadedById.set(p.id, await uploadItemPhoto(p.file, user.id));
            }
          }),
        );

        // 화면 순서대로 최종 URL 리스트(기존 url + 신규 업로드 url).
        const finalUrls = photos
          .map((p) =>
            p.kind === "existing" ? p.url : (uploadedById.get(p.id) ?? ""),
          )
          .filter(Boolean);

        setPhase("saving");
        const res = await updateItem({ itemId, data, photo_urls: finalUrls });
        if (!res.success) {
          // 저장 실패 → 이번에 새로 올린 사진만 정리(기존 사진은 보존)
          const uploaded = [...uploadedById.values()];
          if (uploaded.length > 0) {
            await Promise.allSettled(
              uploaded.map((url) => deleteStoragePhoto(url)),
            );
          }
          return { error: res.error || "수정에 실패했습니다" };
        }

        // 성공 → 신규 previewUrl 회수 후 상세로 이동
        photos.forEach((p) => {
          if (p.kind === "new") URL.revokeObjectURL(p.previewUrl);
        });
        router.push(`/items/${itemId}`);
      }}
    />
  );
}
