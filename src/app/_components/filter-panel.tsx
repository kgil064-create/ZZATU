"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

interface CategoryOption {
  id: number;
  name: string;
}
interface RegionOption {
  si: string; // 'jeju' | 'seogwipo' | 'all'
  eupmyeondong: string; // 표시 라벨
}

function chip(selected: boolean) {
  return (
    "rounded-full px-3 py-1.5 text-sm transition-colors " +
    (selected
      ? "bg-primary text-primary-foreground"
      : "border border-border bg-muted text-muted-foreground")
  );
}

/**
 * 카테고리·지역 필터 패널. (Phase 6 · 6-B)
 *
 * '필터' 버튼으로 펼치고, 카테고리(단일)·지역(전체/제주시/서귀포시/제주전체, 단일)을 골라
 * '적용' 하면 ?category=&region= 을 세팅(다른 쿼리 보존). '초기화'는 둘 다 제거.
 * 지역 값은 si('jeju'/'seogwipo'/'all')로 넘겨 item-list 가 규칙을 적용한다.
 */
export function FilterPanel({
  categories,
  regions,
}: {
  categories: CategoryOption[];
  regions: RegionOption[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const currentCategory = params.get("category");
  const currentRegion = params.get("region");
  const activeCount = (currentCategory ? 1 : 0) + (currentRegion ? 1 : 0);

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<number | null>(
    currentCategory ? Number(currentCategory) : null,
  );
  const [region, setRegion] = useState<string | null>(currentRegion);

  function toggle() {
    if (!open) {
      // 열 때 현재 URL 상태로 동기화
      setCategory(currentCategory ? Number(currentCategory) : null);
      setRegion(currentRegion);
    }
    setOpen((o) => !o);
  }

  function apply() {
    const next = new URLSearchParams(params.toString());
    if (category != null) next.set("category", String(category));
    else next.delete("category");
    if (region) next.set("region", region);
    else next.delete("region");
    const qs = next.toString();
    router.push(qs ? `/?${qs}` : "/");
    setOpen(false);
  }

  function reset() {
    const next = new URLSearchParams(params.toString());
    next.delete("category");
    next.delete("region");
    setCategory(null);
    setRegion(null);
    const qs = next.toString();
    router.push(qs ? `/?${qs}` : "/");
    setOpen(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        필터
        {activeCount > 0 && (
          <span
            className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: "#0E7C8C" }}
          >
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 space-y-4 rounded-base border border-border bg-card p-3">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">카테고리</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const selected = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(selected ? null : c.id)}
                    className={chip(selected)}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">지역</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRegion(null)}
                className={chip(region === null)}
              >
                전체
              </button>
              {regions.map((r) => {
                const selected = region === r.si;
                return (
                  <button
                    key={r.si}
                    type="button"
                    onClick={() => setRegion(selected ? null : r.si)}
                    className={chip(selected)}
                  >
                    {r.eupmyeondong}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-base border border-border bg-muted py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={apply}
              className="flex-1 rounded-base bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
