# Phase 2 · 자재 등록 화면 설계서

> 코드 작성 전 합의서. 만들 화면·라우팅·예외 처리를 글로 먼저 정리한다.
> Phase 1(카카오 로그인)에서 만든 `requireUser()` 가드를 활용해 로그인 사용자만 등록 가능.

---

## 1. 목표

로그인한 사용자가 **자재를 짜투에 등록**할 수 있고, **거래 종류(구해요/나눔/판매중)에 따라 폼이 달라지며**, **사진과 전화번호까지 안전하게 저장**한다.

- 등록 화면은 모바일 우선 (대부분 현장에서 휴대폰으로 등록할 것)
- 거래 종류가 바뀌면 폼이 즉시 변형 (가격 숨김/표시, 사진 필수/선택 등)
- 사진은 다중 업로드 + 순서 변경 가능
- 전화번호는 상세 페이지에 그대로 노출하지 않고, "전화하기" 버튼 클릭 시에만 공개
- Phase 3(자재 상세)이 만들어지기 전까지는 등록 후 임시 placeholder 페이지로 이동

---

## 2. 사용자 시나리오

### 시나리오 A · 판매할 자재가 생겨서 등록

1. 메인(`/`) 하단 플로팅 `+` 버튼 누름
2. 비로그인이면 `/login?redirect=/items/new` 로 (Phase 1 가드 발동)
3. 로그인됐으면 `/items/new` 로 이동
4. 거래 종류 "판매중" 선택 → 가격 필드 표시됨
5. 사진 3장 업로드 (드래그로 순서 변경)
6. 제목, 카테고리(여러 개 선택 가능), 지역, 운반옵션(여러 개), 상세 설명, 가격(50000), 전화번호 입력
7. "등록" 버튼 클릭 → DB에 저장 + 사진 Storage 업로드
8. 자재 상세(`/items/[id]`)로 이동 (Phase 3 전까진 임시 화면)

### 시나리오 B · 자재가 필요해서 "구해요" 등록

1. 같은 진입 흐름
2. 거래 종류 "구해요" 선택 → 가격 필드 표시(희망가), 사진 필드는 선택사항으로 변경
3. 사진 없이 제목 + 카테고리 + 지역 + 설명 + 희망가만 입력
4. 등록 → 같은 흐름

### 시나리오 C · 남는 자재 나눔

1. 거래 종류 "나눔" 선택 → 가격 필드 자체가 사라짐
2. 사진은 필수
3. 등록 → DB엔 `price=0`, `is_free=true` 같은 식으로 저장

### 시나리오 D · 등록 중 실수로 페이지 나감

- 입력 중인 내용은 **이번 Phase에선 저장 안 함** (Phase 후반에 로컬스토리지 임시저장 추가 검토)
- 페이지 떠날 때 브라우저 기본 "변경사항이 저장되지 않습니다" 경고만 띄움

### 시나리오 E · 사진 업로드 중 실패

- 사진 업로드는 항목별 진행 표시
- 실패 시 그 사진만 다시 시도 또는 제거 가능 (전체 폼 날아가지 않음)
- 모든 사진 업로드 끝난 후에야 "등록" 버튼이 진짜 동작

---

## 3. 만들 파일 목록

| 경로 | 종류 | 책임 |
|---|---|---|
| `src/app/items/new/page.tsx` | Server Component | 등록 페이지 진입점, requireUser 가드 |
| `src/app/items/new/new-item-form.tsx` | Client Component | 폼 전체 (거래 종류 토글, 필드 분기, 제출) |
| `src/app/items/new/_components/photo-uploader.tsx` | Client Component | 다중 사진 업로드 + 순서 변경 |
| `src/app/items/new/_components/category-picker.tsx` | Client Component | 카테고리 카드 그리드 다중 선택 |
| `src/app/items/new/_components/region-picker.tsx` | Client Component | 지역 단일 선택 (그룹 표시) |
| `src/app/items/new/_components/transport-picker.tsx` | Client Component | 운반 옵션 체크박스 다중 선택 |
| `src/app/items/[id]/page.tsx` | Server Component | **임시 placeholder** ("등록 완료, 상세 페이지는 Phase 3에서") |
| `src/app/actions/items.ts` | Server Actions | `createItem()` — DB 저장 + Storage 업로드 |
| `src/components/floating-create-button.tsx` | Client Component | 메인 하단 플로팅 + 버튼 |
| `src/lib/validations/item.ts` | 유틸 | Zod 스키마 (거래 종류별 분기 검증) |
| `src/lib/storage.ts` | 유틸 | 사진 업로드 헬퍼 (Supabase Storage `item-images` 버킷 활용) |

**수정할 파일:**
- `src/app/page.tsx` — `<FloatingCreateButton />` 추가
- `src/components/site-header.tsx` — 변경 없음 (등록 진입은 플로팅 버튼으로)

---

## 4. 각 파일 책임 (상세)

### `src/app/items/new/page.tsx`
- Server Component
- 첫 줄에 `await requireUser('/items/new')` — 비로그인 시 가드 발동
- 서버에서 미리 가져올 것:
  - 카테고리 10개 (DB)
  - 읍면동 43개 (DB, 제주시/서귀포시 그룹화)
  - 운반옵션 5개 (DB)
- 위 데이터를 `<NewItemForm>` 의 props로 전달
- 페이지 제목: "자재 등록"

### `src/app/items/new/new-item-form.tsx`
- Client Component (`"use client"`)
- 거래 종류 state (`'sell' | 'free' | 'request'`)
- React Hook Form + Zod 사용 (검증)
- 거래 종류에 따라 조건부 렌더링:
  - `sell` → 가격 필수, 사진 필수
  - `free` → 가격 자체 없음, 사진 필수
  - `request` → 가격(희망가) 필수, 사진 선택사항
- 제출 시 `createItem` Server Action 호출
- 제출 중에는 버튼 비활성화 + "등록 중..." 표시

### `src/app/items/new/_components/photo-uploader.tsx`
- props: `maxPhotos: number` (기본 10), `required: boolean`, `value`, `onChange`
- 다중 파일 선택 (input type="file" multiple, accept="image/*")
- 선택 즉시 미리보기 표시 (Object URL)
- 각 사진 옆 X 버튼 (제거), 드래그 핸들 (순서 변경)
- 모바일에선 길게 눌러서 순서 변경하는 UX 검토
- 실제 Storage 업로드는 제출 시 한꺼번에 (단순화)
- 5MB 초과 / 이미지 아닌 파일은 거부

### `src/app/items/new/_components/category-picker.tsx`
- props: `categories: Category[]`, `value: string[]`, `onChange`
- 카드 그리드 2열 (모바일) / 3열 (데스크탑)
- 각 카드: 한글명(예: "단열·방수") + 영문 슬러그(예: "insulation") + 선택 시 함덕 딥블루 보더
- 최소 1개 이상 선택해야 통과

### `src/app/items/new/_components/region-picker.tsx`
- props: `regions: Region[]`, `value: string`, `onChange`
- 제주시 / 서귀포시 두 섹션으로 분리
- 각 섹션 안에 읍면동 버튼들 (가로 wrap)
- 단일 선택, 선택된 것만 함덕 딥블루 배경
- 검색 기능은 일단 안 넣고, 43개 다 펼쳐서 보여줌 (필요해지면 Phase 후반에 추가)

### `src/app/items/new/_components/transport-picker.tsx`
- props: `options: TransportOption[]`, `value: string[]`, `onChange`
- 체크박스 5개 가로 (1톤/2.5톤/5톤/지게차/직접픽업)
- 비워두는 것 허용 (DB엔 빈 배열로 저장, 표시할 땐 "협의")

### `src/app/items/[id]/page.tsx` (임시 placeholder)
- Server Component
- DB에서 해당 아이템 가져옴 (없으면 404)
- 아주 간단한 화면:
  - "등록이 완료됐어요" 알림 박스
  - 등록한 정보 요약 (제목, 거래 종류, 가격, 사진 첫 장)
  - "이 화면은 Phase 3에서 본격 상세 페이지로 교체됩니다" 노트
  - "메인으로 돌아가기" 버튼

### `src/app/actions/items.ts`
```ts
'use server'
export async function createItem(formData: FormData) {
  1. requireUser() 호출, user.id 확보
  2. FormData에서 필드 추출
  3. Zod 스키마로 검증 (실패 시 에러 반환)
  4. 사진들을 Storage 'item-images' 버킷에 업로드 (user_id/item_id/index.jpg)
  5. items 테이블에 INSERT (반환된 ID 받기)
  6. revalidatePath('/')
  7. redirect(`/items/${item.id}`)
}
```

### `src/components/floating-create-button.tsx`
- Client Component
- 우하단 고정 위치 (`fixed bottom-6 right-6`)
- 원형 버튼, 함덕 딥블루 배경, 흰색 + 아이콘
- 클릭 시 `/items/new` 로 이동 (Next Link)
- 모바일/데스크탑 모두에서 동일하게 표시
- z-index 적절히 설정해서 다른 요소 위에 항상 떠 있게

### `src/lib/validations/item.ts`
- Zod 스키마
- `itemSchema` — 거래 종류에 따라 분기 (discriminated union)
- 공통 필드: 제목(40자), 카테고리(1개 이상), 지역(필수), 설명(필수), 전화번호(필수, 010-XXXX-XXXX 형식)
- 종류별 추가:
  - `sell`/`request` → 가격(숫자) + 협의 여부
  - `free` → 추가 없음
- 사진은 폼 외부에서 별도 검증

### `src/lib/storage.ts`
- `uploadItemPhotos(userId, itemId, files)` 함수
- 파일별로 `item-images/{userId}/{itemId}/{index}.{ext}` 경로로 업로드
- 업로드된 public URL 배열 반환
- 실패 시 throw

---

## 5. 라우팅 한눈에

| 경로 | 메서드 | 비로그인 접근 | 로그인 접근 |
|---|---|---|---|
| `/items/new` | GET | → `/login?redirect=/items/new` | OK |
| `/items/[id]` | GET | OK (모두 볼 수 있음) | OK |
| Server Action `createItem` | POST | 거부 (requireUser) | OK |

---

## 6. 디자인 토큰 활용

| 영역 | 토큰 | 비고 |
|---|---|---|
| 폼 배경 | `bg-background` | 흰색 |
| 입력 필드 보더 | `border-input` | |
| 입력 필드 포커스 | `ring-ring` | 함덕 딥블루 |
| 거래 종류 선택 칩 (활성) | `bg-primary text-primary-foreground` | 함덕 딥블루 |
| 거래 종류 선택 칩 (비활성) | `bg-muted text-muted-foreground` | |
| 카테고리 카드 (활성) | `border-primary bg-primary/5` | 함덕 딥블루 보더 + 옅은 배경 |
| 카테고리 카드 (비활성) | `border-border` | |
| 등록 버튼 | `bg-primary text-primary-foreground hover:bg-primary-hover` | |
| 플로팅 + 버튼 | `bg-primary text-primary-foreground` | 원형, 함덕 딥블루 |
| 사진 미리보기 보더 | `border-border rounded-base` | |
| 에러 메시지 | `text-destructive` | |
| "가격 협의" 체크박스 | 일반 토큰 | |

---

## 7. 예외 처리 · 보안

1. **로그인 필수** — `/items/new`는 Phase 1의 `requireUser` 가드. Server Action `createItem`도 반드시 user 확인 후 진행.

2. **전화번호 형식 검증** — `010-XXXX-XXXX` 또는 `01012345678` 형태만 허용. Zod 정규식.

3. **사진 파일 검증** — 이미지 MIME 타입만, 5MB 이하, 총 10장 이내. 클라이언트 + 서버 양쪽 검증.

4. **Storage 권한** — 이미 셋업된 `item-images` 버킷의 RLS가 자동으로 사용자별 분리. 본인 user_id 아래 폴더에만 업로드 가능.

5. **전화번호 노출 방지** — items 테이블에는 저장하되, **Phase 3에서 상세 페이지를 만들 때 "전화하기" 버튼을 누른 시점에만 노출**되도록. 지금 Phase 2의 임시 placeholder 페이지에서는 노출 안 함.

6. **가격 입력** — 양의 정수만 허용, 최대 1억 (`100_000_000`) 정도로 상한선. SQL injection 방지는 Supabase 클라이언트가 처리.

7. **사진 업로드 실패 시 롤백** — DB insert 전에 사진을 먼저 업로드하고, 모든 업로드 성공 후에 DB에 한 번에 insert. 실패 시 이미 올라간 사진은 그대로 두되 사용자에게 다시 등록 시도하도록 안내 (단순화).

8. **거래 종류 변경 시** — 사용자가 "판매중" 으로 입력하다가 "나눔" 으로 바꾸면, 입력했던 가격은 사라지지 않고 메모리상엔 유지 (다시 바꾸면 복원). DB 저장 시점에는 종류에 맞게만 저장.

---

## 8. 완료 기준 (DoD)

이 단계가 끝났다고 말하려면 아래가 모두 동작해야 한다.

- [ ] 메인 우하단 플로팅 `+` 버튼 보임 (로그인/비로그인 모두)
- [ ] 비로그인 상태에서 `+` 버튼 클릭 → `/login?redirect=/items/new` 로 이동
- [ ] 로그인 후 자동으로 `/items/new` 로 도착
- [ ] 거래 종류 "판매중" 선택 → 가격 필드 보임
- [ ] 거래 종류 "나눔" 선택 → 가격 필드 사라짐
- [ ] 거래 종류 "구해요" 선택 → 사진 "선택 사항" 표시
- [ ] 카테고리 다중 선택 가능, 선택된 카드는 시각적 구분
- [ ] 지역 단일 선택, 제주시/서귀포시 그룹 표시
- [ ] 운반 옵션 다중 선택 가능, 비워둘 수 있음
- [ ] 사진 5장 업로드 → 미리보기 → 순서 변경 → 일부 제거 → 잘 작동
- [ ] 전화번호 형식 잘못 입력 시 에러 메시지
- [ ] 필수 필드 빈 채로 제출 시 각 필드에 에러 표시
- [ ] 정상 제출 시 Supabase Storage에 사진 업로드 확인 (대시보드)
- [ ] DB의 items 테이블에 행 추가 확인
- [ ] 등록 후 `/items/[id]` 임시 placeholder 페이지로 이동
- [ ] placeholder에 방금 등록한 정보 요약 보임

---

## 9. 의문점 · 미결정

- **사진 압축** — 5MB 그대로 올리면 모바일 데이터 부담. 일단 그대로 가고, Phase 후반에 클라이언트에서 1MB 이하로 압축하는 로직 검토. 라이브러리: `browser-image-compression`.
- **임시 저장** — 작성 중 페이지 새로고침/실수로 닫음 시 입력 내용 복원. localStorage로 30초마다 저장하는 방식 검토. 이번 Phase 2 안엔 포함 안 함, 사용자 피드백 받고 결정.
- **카테고리 다중 선택 개수 상한** — 이론상 10개 다 선택 가능한데 너무 많으면 검색 노이즈. 일단 상한 없이 가고, 실제 사용 패턴 보고 제한 (예: 최대 3개) 검토.
- **사진 순서 변경 UX** — 모바일에서 드래그 라이브러리 무거움. 일단 화살표 ↑/↓ 버튼으로 순서 변경하는 단순 방식 채택. 추후 dnd-kit 등 도입 검토.
- **items 테이블 스키마** — 거래 종류, 가격, 가격협의 여부, 카테고리 다중 등 — Phase 2 첫 단계(스키마 점검 또는 마이그레이션) 에서 확정.

---

## 10. 작업 분할 (실제 코딩 시 순서 제안)

1. **items 테이블 스키마 점검 + 필요 시 마이그레이션** (item_categories 조인 테이블, transport_options 조인 테이블, photos 컬럼 등)
2. `lib/validations/item.ts` — Zod 스키마 작성
3. `app/items/new/page.tsx` — 진입점 + requireUser + 데이터 페치
4. `_components/category-picker.tsx`, `region-picker.tsx`, `transport-picker.tsx` (단순한 것부터)
5. `_components/photo-uploader.tsx` — 가장 트리키, 한 번에 검증
6. `new-item-form.tsx` — 위 컴포넌트들 조립 + 거래 종류 분기
7. `lib/storage.ts` — 사진 업로드 헬퍼
8. `app/actions/items.ts` — `createItem` Server Action
9. `app/items/[id]/page.tsx` — 임시 placeholder
10. `components/floating-create-button.tsx` + 메인 페이지 연결
11. 완료 기준 체크리스트 전체 수동 테스트