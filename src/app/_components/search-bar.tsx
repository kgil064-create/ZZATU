"use client";

import { useState, type SyntheticEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

/**
 * 키워드 검색창. (Phase 6 · 6-A)
 *
 * 제출(엔터/버튼) 시 현재 쿼리(type/category/region)는 보존하고 ?q= 만 갱신한다.
 * 비우면 q 를 제거. 라이브 디바운스는 추후.
 */
export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  function submit(e: SyntheticEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    const q = value.trim();
    if (q) next.set("q", q);
    else next.delete("q");
    const qs = next.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Search
          size={20}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "#0E7C8C" }}
        />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="어떤 자재를 찾으세요?"
          className="h-11 w-full rounded-lg bg-gray-100 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C8C]/30"
        />
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-base bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        검색
      </button>
    </form>
  );
}
