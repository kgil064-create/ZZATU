"use client";

export type DeliveryOption = "available" | "unavailable" | "negotiable";

const OPTIONS: { value: DeliveryOption; label: string }[] = [
  { value: "available", label: "배송 가능" },
  { value: "unavailable", label: "배송 불가" },
  { value: "negotiable", label: "배송 협의" },
];

interface DeliveryPickerProps {
  value: DeliveryOption | null;
  onChange: (next: DeliveryOption | null) => void;
}

/**
 * 배송 여부 단일 선택(3택). 지역·카테고리 피커와 동일한 카드 버튼 스타일.
 *
 * 선택 항목(optional)이라 같은 값을 다시 누르면 해제(null)된다.
 * 값 매핑: 배송 가능=available / 배송 불가=unavailable / 배송 협의=negotiable.
 */
export function DeliveryPicker({ value, onChange }: DeliveryPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(selected ? null : opt.value)}
            aria-pressed={selected}
            className={
              "flex cursor-pointer items-center rounded-base border px-3 py-2 text-left transition-colors " +
              (selected
                ? "border-primary bg-primary/5"
                : "border-border bg-background")
            }
          >
            <span className="text-sm font-medium text-foreground">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
