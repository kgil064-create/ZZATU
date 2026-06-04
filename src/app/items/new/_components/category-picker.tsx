"use client";

export type Category = {
  id: number;
  code: string;
  name: string;
  display_order: number;
};

interface CategoryPickerProps {
  categories: Category[];
  value: number[]; // 선택된 category id 배열
  onChange: (next: number[]) => void;
  maxSelections?: number; // 기본 3
  error?: string; // 외부 검증 에러 메시지 (옵션)
}

/**
 * 카테고리 선택 카드 그리드. (Phase 2 · 4단계)
 *
 * 제어 컴포넌트: 선택된 id 배열을 value 로 받고 토글 시 onChange 로 전체 배열을 돌려준다.
 * 최소 1개 검증은 상위 폼/스키마에서 처리하므로 여기서는 0개도 허용한다.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
  maxSelections = 3,
  error,
}: CategoryPickerProps) {
  const reachedMax = value.length >= maxSelections;

  function toggle(id: number) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
      return;
    }
    // 미선택 상태 → 추가. 단, 최대치 도달 시 차단(시각적 힌트로만 안내).
    if (reachedMax) return;
    onChange([...value, id]);
  }

  return (
    <div>
      <p
        className={
          "mb-2 text-xs " +
          (reachedMax ? "text-foreground" : "text-muted-foreground")
        }
      >
        최대 {maxSelections}개까지 선택할 수 있어요 · {value.length}/
        {maxSelections}
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {categories.map((category) => {
          const selected = value.includes(category.id);
          const disabled = !selected && reachedMax;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggle(category.id)}
              disabled={disabled}
              aria-pressed={selected}
              className={
                "relative flex flex-col items-start rounded-base border px-3 py-2 text-left transition-colors " +
                (selected
                  ? "border-primary bg-primary/5 "
                  : "border-border bg-background ") +
                (disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer")
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
                {category.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {category.code}
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
