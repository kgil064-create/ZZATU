import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import {
  NewItemForm,
  type Category,
  type Region,
  type TransportOption,
} from "./new-item-form";

export default async function NewItemPage() {
  await requireUser("/items/new");

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
        />
      </div>
    </main>
  );
}
