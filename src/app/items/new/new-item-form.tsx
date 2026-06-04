"use client";

export type Category = {
  id: number;
  code: string;
  name: string;
  display_order: number;
};

export type Region = {
  id: number;
  si: string;
  eupmyeondong: string;
  display_order: number;
};

export type TransportOption = {
  code: string;
  name: string;
  display_order: number;
};

export type NewItemFormProps = {
  categories: Category[];
  regions: Region[];
  transportOptions: TransportOption[];
};

/**
 * 자재 등록 폼. (Phase 2 · 3단계 placeholder)
 *
 * 다음 단계(4단계)에서 실제 입력 UI 로 교체된다. 현재는 서버에서 받은
 * 마스터 데이터가 잘 전달되는지 확인하기 위한 JSON 출력만 한다.
 */
export function NewItemForm(props: NewItemFormProps) {
  return (
    <pre className="overflow-auto rounded-base bg-muted p-4 text-xs text-muted-foreground">
      {JSON.stringify(props, null, 2)}
    </pre>
  );
}
