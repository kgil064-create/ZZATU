/**
 * 자재 등록 폼 검증 스키마.
 *
 * type(거래 종류) 에 따라 가격 필드 유무가 달라지므로 discriminatedUnion 으로 분기.
 * 사진(item_images) 은 Server Action 에서 별도 처리하므로 이 스키마에 포함하지 않는다.
 * 대신 type 별 사진 정책은 photoPolicy 로 export 한다.
 */
import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^010-?\d{4}-?\d{4}$/, {
    message: "010으로 시작하는 휴대폰 번호를 입력해주세요",
  })
  .transform((val) => val.replace(/-/g, ""));

const baseShape = {
  title: z
    .string()
    .trim()
    .min(1, { message: "제목을 입력해주세요" })
    .max(40, { message: "제목은 40자 이내로 입력해주세요" }),
  item_name: z
    .string()
    .trim()
    .min(1, { message: "자재 명칭을 입력해주세요" })
    .max(30, { message: "명칭은 30자 이내로 입력해주세요" }),
  spec: z
    .string()
    .trim()
    .max(30, { message: "규격은 30자 이내로 입력해주세요" })
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  quantity: z
    .preprocess(
      (val) => {
        if (val === "" || val === undefined || val === null) return undefined;
        const num = typeof val === "string" ? Number(val) : val;
        return Number.isNaN(num) ? undefined : num;
      },
      z
        .number({ message: "수량은 숫자로 입력해주세요" })
        .int({ message: "수량은 정수로 입력해주세요" })
        .min(1, { message: "수량은 1 이상으로 입력해주세요" })
        .optional(),
    ),
  unit: z
    .string()
    .trim()
    .max(10, { message: "단위는 10자 이내로 입력해주세요" })
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  description: z
    .string()
    .min(1, { message: "상세 설명을 입력해주세요" }),
  region_id: z
    .number({ message: "지역을 선택해주세요" })
    .int({ message: "지역 ID가 올바르지 않아요" })
    .min(1, { message: "지역을 선택해주세요" })
    .max(32767, { message: "지역 ID 범위를 벗어났어요" }),
  region_memo: z
    .string()
    .trim()
    .max(100, { message: "지역 메모는 100자 이내로 입력해주세요" })
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  category_ids: z
    .array(z.number().int().positive())
    .min(1, { message: "카테고리를 1개 이상 선택해주세요" }),
  transport_options: z.array(z.string()),
  // 배송 여부(선택). 미선택이면 undefined. DB delivery_option 컬럼과 1:1.
  delivery_option: z.enum(["available", "unavailable", "negotiable"]).optional(),
  contact_phone: phoneSchema,
};

const priceField = z
  .number({ message: "가격을 입력해주세요" })
  .int({ message: "가격은 정수로 입력해주세요" })
  .positive({ message: "가격은 0보다 커야 해요" })
  .max(100_000_000, { message: "가격은 1억원 이하로 입력해주세요" });

const priceOptionField = z.enum(["fixed", "negotiable"], {
  message: "가격 옵션을 선택해주세요",
});

// 가격은 "가격 입력(fixed)"일 때만 필수. "가격 협의(negotiable)"면 price 는 생략(null 저장).
// → price 를 optional 로 두고, 아래 superRefine 에서 fixed 인데 비었을 때만 오류.
const sellSchema = z.object({
  type: z.literal("sell"),
  ...baseShape,
  price: priceField.optional(),
  price_option: priceOptionField,
});

const requestSchema = z.object({
  type: z.literal("request"),
  ...baseShape,
  price: priceField.optional(),
  price_option: priceOptionField,
});

const freeSchema = z.object({
  type: z.literal("free"),
  ...baseShape,
});

export const itemSchema = z
  .discriminatedUnion("type", [sellSchema, requestSchema, freeSchema])
  .superRefine((data, ctx) => {
    // 나눠요(free)가 아니고 "가격 입력"인데 금액이 없으면 필수 오류.
    if (
      data.type !== "free" &&
      data.price_option === "fixed" &&
      data.price == null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "가격을 입력해주세요",
        path: ["price"],
      });
    }
  });

export type ItemInput = z.infer<typeof itemSchema>;

export const photoPolicy = {
  sell: { required: true, max: 10 },
  free: { required: true, max: 10 },
  request: { required: false, max: 10 },
} as const;
