"use client";

export type Region = {
  id: number;
  si: "jeju" | "seogwipo" | "all";
  eupmyeondong: string;
  display_order: number;
};

interface RegionPickerProps {
  regions: Region[];
  regionId: number | null;
  onRegionChange: (next: number | null) => void;
  regionMemo: string;
  onRegionMemoChange: (next: string) => void;
}

/**
 * 지역 단일 선택(3택) + 이동 가능 메모. (Phase 2 · 4단계 수정)
 *
 * 제주시 / 서귀포시 / 제주 전체(이동 가능) 3개 옵션을 라디오 카드로 제시한다.
 * 같은 옵션을 다시 누르면 선택 해제(null). region_memo 는 같은 묶음 UX 로 함께 둔다.
 */
export function RegionPicker({
  regions,
  regionId,
  onRegionChange,
  regionMemo,
  onRegionMemoChange,
}: RegionPickerProps) {
  const options = [...regions].sort(
    (a, b) => a.display_order - b.display_order,
  );

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
                "relative flex items-center rounded-base border px-3 py-2 text-left transition-colors " +
                (selected
                  ? "border-primary bg-primary/5 "
                  : "border-border bg-background ") +
                "cursor-pointer"
              }
            >
              {selected && (
                <span className="absolute left-1.5 top-1.5 text-primary">
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
            </button>
          );
        })}
      </div>

      <div>
        <label
          htmlFor="region-memo"
          className="mb-1 block text-sm text-foreground"
        >
          이동 가능 메모 (선택)
        </label>
        <input
          id="region-memo"
          type="text"
          value={regionMemo}
          onChange={(e) => onRegionMemoChange(e.target.value)}
          maxLength={100}
          placeholder="추가 상세나 조건 (예: 시내 쪽 거래 선호)"
          className="w-full rounded-base border border-input px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
