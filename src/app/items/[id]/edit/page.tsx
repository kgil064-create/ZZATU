// 자재 수정 진입. (Phase 3 · 묶음 5 · Server Component)
//
// requireUser 로 로그인 강제 + 소유자 확인(아니면 메인으로 redirect). 자재 전 필드 +
// 사진(item_images) + 카테고리(item_categories)를 조회해 EditItemForm 에 prefill 한다.

import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  EditItemForm,
  type Category,
  type ItemFormValues,
  type Region,
  type TransportOption,
} from "./edit-item-form";

interface EditItem {
  user_id: string;
  type: "sell" | "free" | "request";
  title: string;
  item_name: string | null;
  spec: string | null;
  quantity: number | null;
  unit: string | null;
  price: number | null;
  price_option: "fixed" | "negotiable" | "free";
  description: string | null;
  region_id: number | null;
  region_memo: string | null;
  transport_options: string[];
  delivery_option: "available" | "unavailable" | "negotiable" | null;
  contact_phone: string | null;
  item_images: { id: string; url: string; display_order: number }[];
  item_categories: { category_id: number }[];
}

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/items/${id}/edit`);
  const supabase = await createClient();

  const [itemResult, categoriesResult, regionsResult, transportResult] =
    await Promise.all([
      supabase
        .from("items")
        .select(
          "user_id, type, title, item_name, spec, quantity, unit, price, price_option, description, region_id, region_memo, transport_options, delivery_option, contact_phone, item_images(id, url, display_order), item_categories(category_id)",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("categories")
        .select("id, code, name, display_order")
        .order("display_order"),
      supabase
        .from("regions")
        .select("id, si, eupmyeondong, display_order")
        .lt("display_order", 100)
        .order("display_order"),
      supabase
        .from("transport_options")
        .select("code, name, display_order")
        .order("display_order"),
    ]);

  const item = itemResult.data as unknown as EditItem | null;
  if (!item) notFound();

  // 소유자가 아니면 메인으로 돌려보낸다(액션에서도 재검증하지만 진입부터 차단).
  if (item.user_id !== user.id) redirect("/");

  const categories = (categoriesResult.data ?? []) as Category[];
  const regions = (regionsResult.data ?? []) as Region[];
  const transportOptions = (transportResult.data ?? []) as TransportOption[];

  const photos = [...item.item_images]
    .sort((a, b) => a.display_order - b.display_order)
    .map((img) => ({ kind: "existing" as const, id: img.id, url: img.url }));

  const initialValues: Partial<ItemFormValues> = {
    type: item.type,
    photos,
    title: item.title,
    itemName: item.item_name ?? "",
    spec: item.spec ?? "",
    quantity: item.quantity ?? "",
    unit: item.unit ?? "",
    categoryIds: item.item_categories.map((c) => c.category_id),
    price: item.price ?? "",
    priceNegotiable: item.price_option === "negotiable",
    description: item.description ?? "",
    regionId: item.region_id,
    regionMemo: item.region_memo ?? "",
    transports: item.transport_options ?? [],
    deliveryOption: item.delivery_option ?? null,
    phone: item.contact_phone ?? "",
  };

  return (
    <main className="mx-auto w-full max-w-screen-md px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        자재 수정
      </h1>
      <EditItemForm
        itemId={id}
        categories={categories}
        regions={regions}
        transportOptions={transportOptions}
        initialValues={initialValues}
      />
    </main>
  );
}
