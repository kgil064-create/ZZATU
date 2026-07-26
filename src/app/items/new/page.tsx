import { requireUser } from "@/lib/auth";
import { isTradeType } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

import {
  NewItemForm,
  type Category,
  type Region,
  type TransportOption,
} from "./new-item-form";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  // 목록 탭에서 넘어온 거래유형 기본값. 화이트리스트를 통과한 값만 쓰고,
  // 그 외(?type=xxx, 배열, 없음)는 undefined → 폼이 자체 기본값을 유지한다.
  const defaultType = isTradeType(sp.type) ? sp.type : undefined;

  // 로그인 후 원래 자리로 되돌아올 때 유형이 날아가지 않도록 쿼리를 붙여 넘긴다.
  await requireUser(
    defaultType ? `/items/new?type=${defaultType}` : "/items/new",
  );

  const supabase = await createClient();
  const [categoriesResult, regionsResult, transportResult] = await Promise.all([
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

  const categories = (categoriesResult.data ?? []) as Category[];
  const regions = (regionsResult.data ?? []) as Region[];
  const transportOptions = (transportResult.data ?? []) as TransportOption[];

  return (
    <main className="mx-auto max-w-screen-md px-4 py-6">
      <p className="text-sm text-muted-foreground">
        짜투에 자재를 등록해 보세요
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
        자재 등록
      </h1>
      <div className="mt-6">
        <NewItemForm
          categories={categories}
          regions={regions}
          transportOptions={transportOptions}
          defaultType={defaultType}
        />
      </div>
    </main>
  );
}
