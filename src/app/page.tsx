import { Suspense } from "react";

import type { TradeType } from "@/lib/format";
import { ItemList } from "./_components/item-list";
import { SearchBar } from "./_components/search-bar";
import { TypeTabs } from "./_components/type-tabs";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const raw = typeof sp.type === "string" ? sp.type : undefined;
  const type: TradeType | undefined =
    raw === "sell" || raw === "free" || raw === "request" ? raw : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;

  return (
    <main className="mx-auto w-full max-w-screen-md px-4 py-4">
      {/* useSearchParams 를 쓰는 클라이언트 컴포넌트는 Suspense 로 감싼다. */}
      <Suspense>
        <SearchBar />
        <div className="mt-3">
          <TypeTabs />
        </div>
      </Suspense>
      <div className="mt-4">
        <ItemList type={type} q={q} />
      </div>
    </main>
  );
}
