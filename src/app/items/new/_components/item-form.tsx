"use client";

/**
 * 자재 폼 — 등록(create)·수정(edit) 공유 단일 소스. (Phase 3 · 묶음 5)
 *
 * 필드 상태·검증·레이아웃을 모두 여기서 보유하고, 모드별 영속화(사진 업로드 + 액션)는
 * onSubmit 콜백으로 주입받는다. 검증은 제출 시점에 lib/validations/item.ts 의
 * itemSchema 로 일괄 수행한다(실시간 검증 없음). 사진은 스키마 밖이라 별도 분기 검증.
 *
 * 상태는 React Hook Form 대신 useState(설계서 4번 메모 유지). 폼이 더 커지면 RHF 재검토.
 */

import { useState, type SyntheticEvent } from "react";

import type { ItemInput } from "@/lib/validations/item";
import { itemSchema } from "@/lib/validations/item";
import type { TradeType } from "@/lib/format";
import { CategoryPicker, type Category } from "./category-picker";
import {
  PhotoUploader,
  type GalleryPhoto,
} from "./photo-uploader";
import { RegionPicker, type Region } from "./region-picker";
import { TransportPicker, type TransportOption } from "./transport-picker";

// 마스터 데이터 타입을 그대로 재노출(페이지들이 캐스팅에 사용).
export type { Category, Region, TransportOption };
export type { GalleryPhoto };

const TYPE_OPTIONS: { value: TradeType; label: string }[] = [
  { value: "request", label: "구해요" },
  { value: "free", label: "나눔" },
  { value: "sell", label: "판매중" },
];

/** raw 숫자열 → 010-1234-5678 형태로 점진적 포맷. */
function formatPhone(d: string) {
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

const inputClass =
  "w-full rounded-base border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass = "block text-sm font-medium mb-1";
const errorClass = "text-destructive text-sm mt-1";

/** 폼 초기값(수정 시 prefill). 미지정 필드는 등록 기본값을 쓴다. */
export interface ItemFormValues {
  type: TradeType;
  photos: GalleryPhoto[];
  title: string;
  itemName: string;
  spec: string;
  quantity: number | "";
  unit: string;
  categoryIds: number[];
  price: number | "";
  priceNegotiable: boolean;
  description: string;
  regionId: number | null;
  regionMemo: string;
  transports: string[];
  phone: string; // raw digits
}

export interface ItemFormSubmitArgs {
  data: ItemInput; // itemSchema 통과 데이터
  photos: GalleryPhoto[]; // 최종 정렬 사진(기존+신규)
  setPhase: (phase: "uploading" | "saving") => void;
}

export interface ItemFormProps {
  categories: Category[];
  regions: Region[];
  transportOptions: TransportOption[];
  initialValues?: Partial<ItemFormValues>;
  submitLabel: string; // "등록" | "수정"
  /** 검증 통과 후 호출. 실패 시 { error } 반환(표시), 성공 시 직접 화면 이동. */
  onSubmit: (args: ItemFormSubmitArgs) => Promise<{ error?: string } | void>;
}

export function ItemForm({
  categories,
  regions,
  transportOptions,
  initialValues,
  submitLabel,
  onSubmit,
}: ItemFormProps) {
  const [type, setType] = useState<TradeType>(initialValues?.type ?? "sell");
  const [photos, setPhotos] = useState<GalleryPhoto[]>(
    initialValues?.photos ?? [],
  );
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [itemName, setItemName] = useState(initialValues?.itemName ?? "");
  const [spec, setSpec] = useState(initialValues?.spec ?? "");
  const [quantity, setQuantity] = useState<number | "">(
    initialValues?.quantity ?? "",
  );
  const [unit, setUnit] = useState(initialValues?.unit ?? "");
  const [categoryIds, setCategoryIds] = useState<number[]>(
    initialValues?.categoryIds ?? [],
  );
  const [price, setPrice] = useState<number | "">(initialValues?.price ?? "");
  const [priceNegotiable, setPriceNegotiable] = useState(
    initialValues?.priceNegotiable ?? false,
  );
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [regionId, setRegionId] = useState<number | null>(
    initialValues?.regionId ?? null,
  );
  const [regionMemo, setRegionMemo] = useState(initialValues?.regionMemo ?? "");
  const [transports, setTransports] = useState<string[]>(
    initialValues?.transports ?? [],
  );
  const [phone, setPhone] = useState(initialValues?.phone ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitPhase, setSubmitPhase] = useState<
    "idle" | "uploading" | "saving"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const showPrice = type !== "free"; // 나눔은 가격 개념 없음
  const photoRequired = type !== "request"; // 구해요만 사진 선택

  function handlePriceChange(value: string) {
    const raw = value.replace(/[^0-9]/g, "");
    if (raw === "") {
      setPrice("");
      return;
    }
    const n = parseInt(raw, 10);
    if (n <= 100_000_000) setPrice(n);
  }

  function handlePhoneChange(value: string) {
    setPhone(value.replace(/[^0-9]/g, "").slice(0, 11));
  }

  async function validateAndSubmit(e: SyntheticEvent) {
    e.preventDefault();
    setSubmitError(null);

    const input = {
      type,
      title,
      item_name: itemName,
      spec: spec || undefined,
      quantity: quantity === "" ? undefined : Number(quantity),
      unit: unit || undefined,
      category_ids: categoryIds,
      region_id: regionId,
      region_memo: regionMemo || undefined,
      transport_options: transports,
      contact_phone: phone, // raw digits — Zod transform 이 정규화
      description,
      ...(type !== "free" && {
        price: typeof price === "number" ? price : undefined,
        price_option: priceNegotiable ? "negotiable" : "fixed",
      }),
    };

    // 1. 클라이언트 검증
    const result = itemSchema.safeParse(input);
    const nextErrors: Record<string, string> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
    }
    // 사진은 Zod 스키마 밖이라 별도 검증.
    if (photoRequired && photos.length === 0) {
      nextErrors.photos = "사진을 1장 이상 추가해주세요";
    }

    setErrors(nextErrors);
    if (!result.success || Object.keys(nextErrors).length > 0) return;

    // 2. 모드별 영속화는 onSubmit 에 위임. 성공 시 onSubmit 이 화면을 이동시킨다.
    try {
      const res = await onSubmit({
        data: result.data,
        photos,
        setPhase: setSubmitPhase,
      });
      if (res && res.error) {
        setSubmitError(res.error);
        setSubmitPhase("idle");
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다",
      );
      setSubmitPhase("idle");
    }
  }

  const submitting = submitPhase !== "idle";

  return (
    <form onSubmit={validateAndSubmit} className="space-y-8">
      {/* 1. 거래 종류 토글 */}
      <section>
        <div className="flex gap-2">
          {TYPE_OPTIONS.map((opt) => {
            const active = type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                aria-pressed={active}
                className={
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors " +
                  (active
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-muted text-muted-foreground")
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. 사진 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">사진</h2>
        <PhotoUploader
          value={photos}
          onChange={setPhotos}
          maxPhotos={10}
          required={photoRequired}
          error={errors.photos}
        />
      </section>

      {/* 3. 제목 */}
      <section>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="title" className="text-sm font-medium text-foreground">
            제목
          </label>
          <span
            className={
              "text-xs " +
              (title.length >= 35 ? "text-foreground" : "text-muted-foreground")
            }
          >
            {title.length}/40
          </span>
        </div>
        <input
          id="title"
          type="text"
          maxLength={40}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) 인테리어 끝나고 남은 단열재"
          className={inputClass}
        />
        {errors.title && <p className={errorClass}>{errors.title}</p>}
      </section>

      {/* 4. 자재 정보 (명칭 / 규격·수량·단위) */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">자재 정보</h2>
        <div>
          <label htmlFor="item_name" className={labelClass}>
            명칭
          </label>
          <input
            id="item_name"
            type="text"
            maxLength={30}
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="예) 단열재"
            className={inputClass}
          />
          {errors.item_name && <p className={errorClass}>{errors.item_name}</p>}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="spec" className={labelClass}>
              규격
            </label>
            <input
              id="spec"
              type="text"
              maxLength={30}
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              placeholder="예) 50T 1200×600"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="quantity" className={labelClass}>
              수량
            </label>
            <input
              id="quantity"
              type="number"
              inputMode="numeric"
              min={1}
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="예) 30"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="unit" className={labelClass}>
              단위
            </label>
            <input
              id="unit"
              type="text"
              maxLength={10}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="예) 장"
              className={inputClass}
            />
          </div>
        </div>
        {(errors.spec || errors.quantity || errors.unit) && (
          <p className={errorClass}>
            {errors.spec || errors.quantity || errors.unit}
          </p>
        )}
      </section>

      {/* 5. 카테고리 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">카테고리</h2>
        <CategoryPicker
          categories={categories}
          value={categoryIds}
          onChange={setCategoryIds}
          error={errors.category_ids}
        />
      </section>

      {/* 6. 가격 + 가격 옵션 (나눔이면 렌더링 안 함) */}
      {showPrice && (
        <section>
          <label htmlFor="price" className={labelClass}>
            {type === "request" ? "희망가" : "가격"}
          </label>
          <div className="relative">
            <input
              id="price"
              type="text"
              inputMode="numeric"
              value={price === "" ? "" : price.toLocaleString("ko-KR")}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="예) 50,000"
              className={inputClass + " pr-8"}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              원
            </span>
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={priceNegotiable}
              onChange={(e) => setPriceNegotiable(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            가격 협의 가능
          </label>
          {errors.price && <p className={errorClass}>{errors.price}</p>}
        </section>
      )}

      {/* 7. 상세 설명 */}
      <section>
        <label htmlFor="description" className={labelClass}>
          상세 설명
        </label>
        <textarea
          id="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="예) 사용감 있지만 시공엔 문제없어요. 비 안 맞게 창고에 보관 중입니다. 같은 식으로 자유롭게 적어주세요."
          className={inputClass}
        />
        {errors.description && (
          <p className={errorClass}>{errors.description}</p>
        )}
      </section>

      {/* 8. 지역 + 이동 메모 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">지역</h2>
        <RegionPicker
          regions={regions}
          regionId={regionId}
          onRegionChange={setRegionId}
          regionMemo={regionMemo}
          onRegionMemoChange={setRegionMemo}
          error={errors.region_id}
        />
      </section>

      {/* 9. 운반 옵션 (검증 안 함) */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">운반 옵션</h2>
        <TransportPicker
          options={transportOptions}
          value={transports}
          onChange={setTransports}
        />
      </section>

      {/* 10. 전화번호 */}
      <section>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-foreground"
        >
          연락처 (전화번호)
        </label>
        <p className="mt-1 mb-2 text-xs text-muted-foreground">
          {
            "상세 페이지에 그대로 노출되지 않아요. '전화하기' 버튼을 누른 사람에게만 공개됩니다."
          }
        </p>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          maxLength={13}
          value={formatPhone(phone)}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="010-1234-5678"
          className={inputClass}
        />
        {errors.contact_phone && (
          <p className={errorClass}>{errors.contact_phone}</p>
        )}
      </section>

      {/* 11. 제출 버튼 */}
      <div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-base bg-primary py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitPhase === "uploading"
            ? "사진 업로드 중..."
            : submitPhase === "saving"
              ? `${submitLabel} 중...`
              : submitLabel}
        </button>
        {submitError && (
          <p className="mt-2 text-center text-sm text-destructive">
            {submitError}
          </p>
        )}
      </div>
    </form>
  );
}
