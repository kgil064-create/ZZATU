import { Suspense } from "react";

import type { TradeType } from "@/lib/format";
import { ItemList } from "./_components/item-list";
import { TypeTabs } from "./_components/type-tabs";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = typeof sp.type === "string" ? sp.type : undefined;
  const type: TradeType | undefined =
    raw === "sell" || raw === "free" || raw === "request" ? raw : undefined;

  return (
    <main className="mx-auto w-full max-w-screen-md px-4 py-4">
      {/* useSearchParams 를 쓰는 클라이언트 탭은 Suspense 로 감싼다. */}
      <Suspense>
        <TypeTabs />
      </Suspense>
      <div className="mt-4">
        <ItemList type={type} />
      </div>
    </main>
  );
}
