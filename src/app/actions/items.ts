"use server";

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
      : { price: data.price, price_option: data.price_option };

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
    .select("contact_phone")
    .eq("id", itemId)
    .maybeSingle();

  if (error || !data?.contact_phone) return { error: "not_found" };
  return { phone: data.contact_phone as string };
}
