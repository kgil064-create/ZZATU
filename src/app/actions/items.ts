"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { itemSchema, type ItemInput } from "@/lib/validations/item";

// ItemInput 은 type 별 discriminated union 이라 interface extends 가 불가능하다.
// 교차 타입으로 photo_urls 를 더한다(union 각 멤버에 분배됨).
export type CreateItemPayload = ItemInput & {
  photo_urls: string[]; // 클라이언트가 업로드 후 받은 URL들 (display_order = 배열 인덱스)
};

export interface CreateItemResult {
  success: boolean;
  itemId?: string;
  error?: string;
}

/**
 * 자재 등록 Server Action.
 *
 * Supabase JS 는 트랜잭션 지원이 약해 옵션 B(순차 INSERT + 실패 시 수동 롤백)로 처리한다.
 * items INSERT 후 item_categories / item_images 중 하나라도 실패하면 방금 만든 items 행을
 * 지워 정리한다(자식 테이블은 FK on delete cascade 로 함께 제거됨).
 *
 * 가격: price_option 은 NOT NULL 이라 free 일 때도 'free' 를 넣어야 한다(price 는 null).
 * status 컬럼은 스키마에 없으므로 INSERT 에서 제외하고 is_sold 기본값(false)에 맡긴다.
 */
export async function createItem(
  payload: CreateItemPayload,
): Promise<CreateItemResult> {
  // 1. 서버 사이드 재검증 (클라이언트 검증을 통과해도 한 번 더)
  const parsed = itemSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "입력값이 올바르지 않습니다" };
  }
  const data = parsed.data;

  // 2. 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  // 3. items INSERT
  const priceFields =
    data.type === "free"
      ? { price: null, price_option: "free" as const }
      : { price: data.price ?? null, price_option: data.price_option };

  const { data: inserted, error: itemError } = await supabase
    .from("items")
    .insert({
      user_id: user.id,
      type: data.type,
      title: data.title,
      item_name: data.item_name,
      spec: data.spec ?? null,
      quantity: data.quantity ?? null,
      unit: data.unit ?? null,
      region_id: data.region_id,
      region_memo: data.region_memo ?? null,
      transport_options: data.transport_options,
      delivery_option: data.delivery_option ?? null,
      description: data.description,
      contact_phone: data.contact_phone,
      ...priceFields,
    })
    .select("id")
    .single();

  if (itemError || !inserted) {
    return { success: false, error: "자재 등록에 실패했습니다" };
  }
  const newItemId = inserted.id as string;

  // 4. item_categories 조인 테이블 INSERT (다중 카테고리)
  const categoryRows = data.category_ids.map((category_id) => ({
    item_id: newItemId,
    category_id,
  }));
  const { error: catError } = await supabase
    .from("item_categories")
    .insert(categoryRows);
  if (catError) {
    await supabase.from("items").delete().eq("id", newItemId);
    return { success: false, error: "자재 등록에 실패했습니다" };
  }

  // 5. item_images INSERT (사진 URL + 순서, 0이 대표)
  if (payload.photo_urls.length > 0) {
    const imageRows = payload.photo_urls.map((url, idx) => ({
      item_id: newItemId,
      url,
      display_order: idx,
    }));
    const { error: imgError } = await supabase
      .from("item_images")
      .insert(imageRows);
    if (imgError) {
      await supabase.from("items").delete().eq("id", newItemId);
      return { success: false, error: "자재 등록에 실패했습니다" };
    }
  }

  return { success: true, itemId: newItemId };
}

export interface RevealPhoneResult {
  phone?: string;
  error?: string;
}

/**
 * 자재 연락처 공개 Server Action. (Phase 3 · 결정 #1)
 *
 * 전화번호는 상세 페이지 HTML 에 절대 포함하지 않고, "전화하기" 클릭 시에만 이 액션으로
 * 받아 tel: 로 연결한다. 비로그인 호출은 거부해 스크립트의 대량 번호 수집을 막는다.
 */
export async function revealPhone(itemId: string): Promise<RevealPhoneResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const { data, error } = await supabase
    .from("items")
    .select("contact_phone, user_id")
    .eq("id", itemId)
    .maybeSingle();

  if (error || !data?.contact_phone) return { error: "not_found" };

  // 문의 기록: 번호 반환에 성공했고 본인 매물이 아닐 때만. 실패해도 전화 흐름을 막지 않는다.
  // ⚠️ supabase-js 는 RLS·CHECK 위반에 throw 하지 않고 { error } 를 돌려준다 —
  //    try/catch 로는 못 잡으므로 error 를 직접 확인해 로그만 남긴다.
  const ownerId = (data as { user_id: string }).user_id;
  if (ownerId !== user.id) {
    const { error: inquiryError } = await supabase
      .from("item_inquiries")
      .insert({
        item_id: itemId,
        user_id: user.id,
        inquiry_type: "phone",
      });
    if (inquiryError) {
      console.error("[revealPhone] 문의 기록 실패:", inquiryError.message);
    }
  }

  return { phone: data.contact_phone as string };
}

export interface MutateItemResult {
  success: boolean;
  error?: string;
}

/**
 * 거래완료 토글. (Phase 3 · 묶음 4)
 *
 * UI 숨김만 믿지 않고 서버에서 소유자를 재검증한다. is_sold 갱신 후 목록·상세를
 * revalidate 해 배지/카드 dim 이 반영되게 한다.
 */
export async function setItemStatus(
  itemId: string,
  nextIsSold: boolean,
): Promise<MutateItemResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data: item } = await supabase
    .from("items")
    .select("user_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return { success: false, error: "자재를 찾을 수 없습니다" };
  if ((item as { user_id: string }).user_id !== user.id) {
    return { success: false, error: "권한이 없습니다" };
  }

  const { error } = await supabase
    .from("items")
    .update({ is_sold: nextIsSold })
    .eq("id", itemId);
  if (error) return { success: false, error: "상태 변경에 실패했습니다" };

  revalidatePath("/");
  revalidatePath(`/items/${itemId}`);
  return { success: true };
}

/**
 * 자재 삭제. (Phase 3 · 묶음 4)
 *
 * 순서: ① 사진 Storage 경로 수집 → ② items row 삭제(item_images·item_categories 는
 * ON DELETE CASCADE 로 자동 정리) → ③ Storage 실제 파일 삭제(cascade 안 됨).
 * 소유자는 서버에서 재검증한다.
 */
export async function deleteItem(itemId: string): Promise<MutateItemResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data: item } = await supabase
    .from("items")
    .select("user_id, item_images(url)")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return { success: false, error: "자재를 찾을 수 없습니다" };

  const owned = item as { user_id: string; item_images: { url: string }[] };
  if (owned.user_id !== user.id) {
    return { success: false, error: "권한이 없습니다" };
  }

  // full URL → 'item-images/' 뒤 경로 추출
  const paths = (owned.item_images ?? [])
    .map((img) => img.url.match(/item-images\/(.+)$/)?.[1])
    .filter((p): p is string => Boolean(p));

  const { error: delError } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId);
  if (delError) return { success: false, error: "삭제에 실패했습니다" };

  // Storage 파일은 DB cascade 로 안 지워지므로 별도 삭제(베스트 에포트).
  if (paths.length > 0) {
    await supabase.storage.from("item-images").remove(paths);
  }

  revalidatePath("/");
  return { success: true };
}

export type UpdateItemPayload = {
  itemId: string;
  data: ItemInput; // itemSchema 통과 데이터
  photo_urls: string[]; // 최종 정렬된 사진 URL(기존 유지 + 신규 업로드), index = display_order
};

/**
 * 자재 수정 Server Action. (Phase 3 · 묶음 5)
 *
 * 서버에서 소유자 재검증 후: ① items 필드 UPDATE → ② item_categories full-replace
 * (조인 테이블이라 전체 교체가 안전) → ③ 사진 동기화. 사진은 unique(item_id, display_order)
 * 충돌을 피하려고 행을 전부 지우고 최종 순서대로 0..n 으로 재삽입한다(유지된 사진의
 * Storage 파일은 건드리지 않음 — 재업로드 X). 최종 리스트에서 빠진 기존 사진만 Storage 삭제.
 */
export async function updateItem(
  payload: UpdateItemPayload,
): Promise<MutateItemResult> {
  const parsed = itemSchema.safeParse(payload.data);
  if (!parsed.success) {
    return { success: false, error: "입력값이 올바르지 않습니다" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다" };

  const { data: existing } = await supabase
    .from("items")
    .select("user_id, item_images(url)")
    .eq("id", payload.itemId)
    .maybeSingle();
  if (!existing) return { success: false, error: "자재를 찾을 수 없습니다" };

  const owned = existing as { user_id: string; item_images: { url: string }[] };
  if (owned.user_id !== user.id) {
    return { success: false, error: "권한이 없습니다" };
  }

  // ① items 필드 UPDATE (free 는 price null + price_option 'free')
  const priceFields =
    data.type === "free"
      ? { price: null, price_option: "free" as const }
      : { price: data.price ?? null, price_option: data.price_option };

  const { error: upError } = await supabase
    .from("items")
    .update({
      type: data.type,
      title: data.title,
      item_name: data.item_name,
      spec: data.spec ?? null,
      quantity: data.quantity ?? null,
      unit: data.unit ?? null,
      region_id: data.region_id,
      region_memo: data.region_memo ?? null,
      transport_options: data.transport_options,
      delivery_option: data.delivery_option ?? null,
      description: data.description,
      contact_phone: data.contact_phone,
      ...priceFields,
    })
    .eq("id", payload.itemId);
  if (upError) return { success: false, error: "수정에 실패했습니다" };

  // ② item_categories full-replace
  await supabase
    .from("item_categories")
    .delete()
    .eq("item_id", payload.itemId);
  const categoryRows = data.category_ids.map((category_id) => ({
    item_id: payload.itemId,
    category_id,
  }));
  const { error: catError } = await supabase
    .from("item_categories")
    .insert(categoryRows);
  if (catError) return { success: false, error: "카테고리 저장에 실패했습니다" };

  // ③ 사진 동기화
  const currentUrls = (owned.item_images ?? []).map((img) => img.url);
  const finalUrls = payload.photo_urls;
  const removedUrls = currentUrls.filter((url) => !finalUrls.includes(url));

  await supabase.from("item_images").delete().eq("item_id", payload.itemId);
  if (finalUrls.length > 0) {
    const imageRows = finalUrls.map((url, idx) => ({
      item_id: payload.itemId,
      url,
      display_order: idx,
    }));
    const { error: imgError } = await supabase
      .from("item_images")
      .insert(imageRows);
    if (imgError) return { success: false, error: "사진 저장에 실패했습니다" };
  }

  // 최종 리스트에서 빠진 기존 사진만 Storage 에서 삭제(베스트 에포트).
  if (removedUrls.length > 0) {
    const paths = removedUrls
      .map((url) => url.match(/item-images\/(.+)$/)?.[1])
      .filter((p): p is string => Boolean(p));
    if (paths.length > 0) {
      await supabase.storage.from("item-images").remove(paths);
    }
  }

  revalidatePath("/");
  revalidatePath(`/items/${payload.itemId}`);
  return { success: true };
}
