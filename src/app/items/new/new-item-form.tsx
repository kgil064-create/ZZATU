"use client";

import { useState } from "react";

import { CategoryPicker, type Category } from "./_components/category-picker";
import { RegionPicker, type Region } from "./_components/region-picker";
import {
  TransportPicker,
  type TransportOption,
} from "./_components/transport-picker";

// page.tsx 가 마스터 데이터 캐스팅에 쓰므로 타입을 그대로 재노출한다.
export type { Category, Region, TransportOption };

export type NewItemFormProps = {
  categories: Category[];
  regions: Region[];
  transportOptions: TransportOption[];
};

/**
 * 자재 등록 폼. (Phase 2 · 4단계 — picker 시각 검증용)
 *
 * 6단계에서 거래 종류 토글·가격·사진까지 합쳐 실제 폼을 구성한다. 현재는
 * picker 3종이 마스터 데이터를 받아 제대로 렌더·토글되는지 확인하기 위한
 * 임시 레이아웃이다.
 */
export function NewItemForm({
  categories,
  regions,
  transportOptions,
}: NewItemFormProps) {
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [regionId, setRegionId] = useState<number | null>(null);
  const [regionMemo, setRegionMemo] = useState("");
  const [transports, setTransports] = useState<string[]>([]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">카테고리</h2>
        <CategoryPicker
          categories={categories}
          value={categoryIds}
          onChange={setCategoryIds}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">지역</h2>
        <RegionPicker
          regions={regions}
          regionId={regionId}
          onRegionChange={setRegionId}
          regionMemo={regionMemo}
          onRegionMemoChange={setRegionMemo}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          운반 옵션
        </h2>
        <TransportPicker
          options={transportOptions}
          value={transports}
          onChange={setTransports}
        />
      </section>
    </div>
  );
}
