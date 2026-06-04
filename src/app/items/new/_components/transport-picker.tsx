"use client";

export type TransportOption = {
  code: string;
  name: string;
  display_order: number;
};

interface TransportPickerProps {
  options: TransportOption[];
  value: string[]; // 선택된 code 배열
  onChange: (next: string[]) => void;
}

/**
 * 운반 방식 다중 선택 토글. (Phase 2 · 4단계)
 *
 * 의미상 체크박스(다중·빈 배열 허용)지만, 다른 picker 와 톤을 맞추기 위해
 * 버튼 토글 스타일로 렌더링한다.
 */
export function TransportPicker({
  options,
  value,
  onChange,
}: TransportPickerProps) {
  function toggle(code: string) {
    onChange(
      value.includes(code)
        ? value.filter((v) => v !== code)
        : [...value, code],
    );
  }

  const sorted = [...options].sort(
    (a, b) => a.display_order - b.display_order,
  );

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        가능한 운반 방식을 모두 선택하세요. 비워두면 &lsquo;협의&rsquo;로
        표시됩니다.
      </p>
      <div className="flex flex-wrap gap-2">
        {sorted.map((option) => {
          const selected = value.includes(option.code);
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => toggle(option.code)}
              aria-pressed={selected}
              className={
                "rounded-base px-3 py-2 text-sm transition-colors " +
                (selected
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-foreground")
              }
            >
              {option.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
