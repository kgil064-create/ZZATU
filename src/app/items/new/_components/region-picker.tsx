"use client";

export type Region = {
  id: number;
  si: "jeju" | "seogwipo" | "all" | "east" | "west";
  eupmyeondong: string;
  display_order: number;
};

interface RegionPickerProps {
  regions: Region[];
  regionId: number | null;
  onRegionChange: (next: number | null) => void;
  regionMemo: string;
  onRegionMemoChange: (next: string) => void;
  /** false 면 '제주 전체'(si='all') 옵션을 숨긴다(구해요가 아닐 때). 기본 true. */
  allowAll?: boolean;
  /** 지역 메모 입력 placeholder(거래유형별 문구는 상위에서 주입). */
  memoPlaceholder?: string;
  error?: string; // 외부 검증 에러 메시지 (옵션)
}

/** 권역별 대표 지역 힌트(버튼 하단 회색 소문자). si 기준. */
const REGION_HINTS: Record<Region["si"], string> = {
  jeju: "노형·연동·이도·화북 등",
  seogwipo: "중문·동홍·대륜 등",
  east: "조천·구좌·성산·표선·남원",
  west: "애월·한림·한경·대정·안덕",
  all: "어디든 갈 수 있어요",
};

/**
 * 지역(권역) 단일 선택 + 지역 메모. (Phase 2 · 그룹4 권역 개편)
 *
 * 제주시 / 서귀포시 / 동부권 / 서부권 / 제주 전체(이동 가능) 를 카드로 제시한다.
 * '제주 전체'는 allowAll=false(구해요가 아닐 때)면 숨긴다. 각 카드 아래에 대표 지역 힌트를
 * 표시한다. 같은 옵션 재클릭 시 해제(null). 지역 메모(region_memo)는 같은 묶음 UX 로 함께 둔다.
 */
export function RegionPicker({
  regions,
  regionId,
  onRegionChange,
  regionMemo,
  onRegionMemoChange,
  allowAll = true,
  memoPlaceholder,
  error,
}: RegionPickerProps) {
  const options = [...regions]
    .filter((r) => allowAll || r.si !== "all")
    .sort((a, b) => a.display_order - b.display_order);

  function select(id: number) {
    // 같은 항목 재클릭 → 해제
    onRegionChange(regionId === id ? null : id);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((region) => {
          const selected = regionId === region.id;
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => select(region.id)}
              aria-pressed={selected}
              className={
                "relative flex flex-col items-start rounded-base border px-3 py-2 pl-6 text-left transition-colors " +
                (selected
                  ? "border-primary bg-primary/5 "
                  : "border-border bg-background ") +
                "cursor-pointer"
              }
            >
              {selected && (
                <span className="absolute left-1.5 top-2.5 text-primary">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
              <span className="text-sm font-medium text-foreground">
                {region.eupmyeondong}
              </span>
              <span className="text-xs text-muted-foreground">
                {REGION_HINTS[region.si]}
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <label
          htmlFor="region-memo"
          className="mb-1 block text-sm text-foreground"
        >
          지역 메모 (선택)
        </label>
        <input
          id="region-memo"
          type="text"
          value={regionMemo}
          onChange={(e) => onRegionMemoChange(e.target.value)}
          maxLength={100}
          placeholder={memoPlaceholder ?? "추가 상세나 조건"}
          className="w-full rounded-base border border-input px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
