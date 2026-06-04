"use client";

/**
 * 자재 등록 폼. (Phase 2 · 6단계 — 전체 통합)
 *
 * 폼 상태는 React Hook Form 대신 useState 로 관리한다. 설계서(4번)에서 RHF 를
 * 언급했지만 (1) 의존성 추가 보류, (2) 현재 폼 규모가 크지 않음 — 두 이유로
 * 이번 단계는 useState 기반으로 간다. 폼이 더 커지면 RHF 마이그레이션을 재검토.
 *
 * 검증은 등록 버튼 클릭 시점에 lib/validations/item.ts 의 itemSchema 로 일괄
 * 수행한다(실시간 검증 없음). 사진은 스키마 밖이라 별도 분기로 검증한다.
 */

import { useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { uploadItemPhoto, deleteStoragePhoto } from "@/lib/storage";
import { createItem } from "@/app/actions/items";
import { itemSchema } from "@/lib/validations/item";
import { CategoryPicker, type Category } from "./_components/category-picker";
import {
  PhotoUploader,
  type PhotoFile,
} from "./_components/photo-uploader";
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

type TradeType = "sell" | "free" | "request";

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

export function NewItemForm({
  categories,
  regions,
  transportOptions,
}: NewItemFormProps) {
  // 거래 종류
  const [type, setType] = useState<TradeType>("sell");

  // 사진
  const [photos, setPhotos] = useState<PhotoFile[]>([]);

  // 제목
  const [title, setTitle] = useState("");

  // 자재 정보 (4필드)
  const [itemName, setItemName] = useState("");
  const [spec, setSpec] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [unit, setUnit] = useState("");

  // 카테고리
  const [categoryIds, setCategoryIds] = useState<number[]>([]);

  // 가격
  const [price, setPrice] = useState<number | "">("");
  const [priceNegotiable, setPriceNegotiable] = useState(false);

  // 상세
  const [description, setDescription] = useState("");

  // 지역
  const [regionId, setRegionId] = useState<number | null>(null);
  const [regionMemo, setRegionMemo] = useState("");

  // 운반
  const [transports, setTransports] = useState<string[]>([]);

  // 전화번호 (raw digits)
  const [phone, setPhone] = useState("");

  // 검증/제출
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitPhase, setSubmitPhase] = useState<
    "idle" | "uploading" | "saving"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const router = useRouter();

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
      // 필드별 첫 메시지만 취한다. flatten() 은 deprecated 라 issues 를 직접 순회.
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

    try {
      // 2. 사용자 ID
      setSubmitPhase("uploading");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다");

      // 3. 사진 병렬 업로드
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await Promise.all(
          photos.map((p) => uploadItemPhoto(p.file, user.id)),
        );
      }

      // 4. Server Action 호출 (서버에서 재검증 + DB INSERT)
      setSubmitPhase("saving");
      const res = await createItem({ ...result.data, photo_urls: photoUrls });

      if (!res.success) {
        // DB 저장 실패 → 방금 올린 사진들 정리(고아 파일 방지)
        if (photoUrls.length > 0) {
          await Promise.allSettled(
            photoUrls.map((url) => deleteStoragePhoto(url)),
          );
        }
        throw new Error(res.error || "등록에 실패했습니다");
      }

      // 5. 성공 → previewUrl 회수 후 상세 페이지로 이동
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      router.push(`/items/${res.itemId}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다",
      );
      setSubmitPhase("idle");
    }
  }

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
          {errors.item_name && (
            <p className={errorClass}>{errors.item_name}</p>
          )}
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
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          운반 옵션
        </h2>
        <TransportPicker
          options={transportOptions}
          value={transports}
          onChange={setTransports}
        />
      </section>

      {/* 10. 전화번호 */}
      <section>
        <label htmlFor="phone" className="block text-sm font-medium text-foreground">
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

      {/* 11. 등록 버튼 */}
      <div>
        <button
          type="submit"
          disabled={submitPhase !== "idle"}
          className="w-full rounded-base bg-primary py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitPhase === "uploading"
            ? "사진 업로드 중..."
            : submitPhase === "saving"
              ? "등록 중..."
              : "등록"}
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
