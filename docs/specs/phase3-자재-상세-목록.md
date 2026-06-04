# Phase 3 · 자재 상세 + 메인 목록 설계서

> 코드 작성 전 합의서. 만들 화면·라우팅·예외 처리를 글로 먼저 정리한다.
> Phase 2(자재 등록)에서 만든 items 관련 테이블/Storage와 `requireUser()`/`getUser()`를 활용한다.
> ⚠️ 실제 DB 스키마 우선. 운반옵션은 **조인 테이블이 아니라 `items.transport_options text[]` 컬럼**이다
>   (`item_transports` 테이블은 존재하지 않음). 이 문서는 그 보정을 반영했다.

---

## 1. 목표

등록된 자재를 **메인에서 목록으로 보고 → 클릭해서 상세를 확인하고 → 전화로 거래를 시작**할 수 있다.
또한 **내가 올린 글이면 수정/삭제/거래완료 처리**까지 할 수 있다.

- 모바일 우선. 한 손으로 스크롤·스와이프하는 흐름.
- 거래상태가 색으로 한눈에 보인다 (구해요=파랑, 나눔=초록, 판매중=딥블루, 거래완료=회색).
- 전화번호는 **화면에 절대 노출하지 않는다.** "전화하기"를 누르면 곧바로 전화 앱이 열린다.
- 내 글일 때만 수정/삭제/거래완료 버튼이 보인다 (남의 글엔 안 보임).

---

## 2. 사용자 시나리오

### 시나리오 A · 자재를 구경하다 거래
1. 메인(`/`) 진입 → 자재 카드 목록이 최신순으로 보임
2. 상단 탭으로 "구해요 / 나눔 / 판매중" 필터 (기본=전체)
3. 카드 하나 클릭 → `/items/[id]` 상세로 이동
4. 사진을 좌우로 스와이프해 확인, 제목·설명·지역·운반옵션 확인
5. "전화하기" 버튼 클릭 → 곧바로 전화 앱이 판매자 번호로 연결됨 (번호는 화면에 안 보임)

### 시나리오 B · 거래완료 처리 (내 글)
1. 내가 올린 글 상세로 들어감
2. 화면에 "수정 / 삭제 / 거래완료" 버튼이 보임 (남의 글이면 안 보임)
3. "거래완료" 누름 → 상태가 회색 "거래완료" 배지로 바뀜, 목록 카드도 회색 처리
4. 다시 "거래중으로 변경"으로 되돌릴 수 있음

### 시나리오 C · 잘못 올려서 수정 (내 글)
1. 내 글 상세 → "수정" 클릭 → `/items/[id]/edit`
2. Phase 2의 등록 폼이 **기존 값으로 채워진 채** 열림
3. 가격만 고치고 저장 → 상세로 복귀, 바뀐 값 반영

### 시나리오 D · 글 삭제 (내 글)
1. 내 글 상세 → "삭제" 클릭 → 확인 모달("정말 삭제할까요?")
2. 확인 → DB에서 글 + 연결 사진/카테고리 정리 + Storage 사진 파일 삭제
3. 메인(`/`)으로 이동, "삭제되었습니다" 메시지

### 시나리오 E · 없는 글 / 빈 목록
- 존재하지 않는 id로 접근 → `notFound()` (404 화면)
- 목록이 비어 있음 → "아직 등록된 자재가 없어요" 빈 화면 + 등록 유도

---

## 3. 만들 파일 목록

| 경로 | 종류 | 책임 |
|---|---|---|
| `src/app/page.tsx` | Server Component | **재구성** — 데모 본문 제거, 아이템 목록으로 |
| `src/app/_components/item-list.tsx` | Server Component | 목록 데이터 조회 + 카드 렌더 |
| `src/app/_components/item-card.tsx` | Client/Server | 카드 1개 (사진 썸네일, 제목, 가격, 지역, 상태 배지) |
| `src/app/_components/type-tabs.tsx` | Client Component | 전체/구해요/나눔/판매중 탭 (URL 쿼리로 필터) |
| `src/app/items/[id]/page.tsx` | Server Component | **placeholder 교체** — 진짜 상세 페이지 |
| `src/app/items/[id]/_components/photo-gallery.tsx` | Client Component | 가로 스와이프 사진 캐러셀 + 인디케이터 |
| `src/app/items/[id]/_components/call-button.tsx` | Client Component | "전화하기" → 서버에서 번호 받아 tel: 연결 |
| `src/app/items/[id]/_components/owner-controls.tsx` | Client/Server | 내 글일 때만 수정/삭제/거래완료 버튼 |
| `src/app/items/[id]/_components/status-badge.tsx` | Server Component | 거래상태 색 배지 (목록·상세 공유) |
| `src/app/items/[id]/edit/page.tsx` | Server Component | 수정 진입 (requireUser + 소유자 확인) |
| `src/app/items/[id]/edit/edit-item-form.tsx` | Client Component | Phase 2 폼 재사용 (edit 모드, 값 prefill) |
| `src/app/actions/items.ts` | Server Actions | **추가** — `updateItem`, `deleteItem`, `setItemStatus`, `revealPhone` |
| `src/lib/format.ts` | 유틸 | 가격/날짜/상대시간 포맷 헬퍼 |

**수정할 파일:**
- `src/app/items/new/_components/*` — 수정 폼에서 재사용하도록 (필요 시 props로 초기값 받기)
- `src/components/floating-create-button.tsx` — 변경 없음 (그대로 유지)
- `src/app/protected-test/page.tsx` — **삭제** (Phase 1에서 예고한 임시 페이지 정리)

> ⚠️ 운반옵션은 `item_transports` 조인 테이블이 아니라 `items.transport_options text[]` 컬럼이므로,
> 별도 운반 조인 파일/정리 로직은 없다.

---

## 4. 각 파일 책임 (핵심만)

- **item-list**: `status` 정렬은 거래완료를 뒤로, 나머지는 `created_at` 내림차순. 탭 필터는 `?type=` 쿼리로 받음.
- **item-card**: 썸네일은 `item_images`의 첫 장(순서 0). 사진 없으면 회색 플레이스홀더. 흰 배경 카드 유지.
- **status-badge**: 거래완료면 무조건 회색. 아니면 거래종류 색. **목록과 상세가 같은 컴포넌트 공유.**
- **photo-gallery**: 모바일 가로 스와이프(scroll-snap). 사진 1장이면 인디케이터 숨김. 사진 없으면 갤러리 자체 숨김.
- **call-button**: 클릭 → `revealPhone(itemId)` Server Action 호출 → 받은 번호로 `window.location.href = 'tel:...'`. **번호를 화면 텍스트로 렌더하지 않음.**
- **owner-controls**: 서버에서 `getUser().id === item.user_id` 판정 후, 소유자에게만 렌더. 클라이언트 토글 판정만으로 보안 처리하지 않음(서버 액션에서 한 번 더 검증).
- **edit-item-form**: Phase 2의 `new-item-form` 로직 재사용. 차이는 (a) 초기값 prefill, (b) 제출 시 `createItem` 대신 `updateItem`, (c) 사진 편집(기존 원격 사진 + 신규 로컬 사진 혼합 처리).

---

## 5. 라우팅

| 경로 | 설명 | 가드 |
|---|---|---|
| `/` | 메인 = 아이템 목록 | 없음 (비로그인도 구경 가능) |
| `/?type=sell` (또는 `free`/`request`) | 거래종류 필터 | 없음 |
| `/items/[id]` | 자재 상세 | 없음 (구경은 누구나) |
| `/items/[id]/edit` | 수정 | `requireUser` + **소유자 아니면 메인으로 돌려보냄** |

> 탭 쿼리값은 실제 enum 값 `sell`/`free`/`request` 를 그대로 사용한다.
> 구경(목록·상세)은 로그인 없이 가능. **전화걸기는 로그인 유저만**(8번 결정 사항 참고).

---

## 6. 디자인 토큰 활용

- 메인 색: 함덕 딥블루 `#0E7C8C` (primary) — 판매중 배지, 전화하기 버튼, 활성 탭
- 거래상태 배지 색
  - 구해요 → 파랑 계열
  - 나눔 → 초록 계열
  - 판매중 → 딥블루(primary)
  - 거래완료 → 회색 (카드 전체도 살짝 dim 처리)
- 카드: 흰 배경, 은은한 보더/그림자, 라운드 — Phase 2 토큰 유지
- 글자: 보통 크기, 깔끔하게. 가격만 약간 강조(굵게)
- 삭제 버튼만 경고색(빨강 계열) — 위험 액션 구분

---

## 7. 예외 / 보안

- **전화번호 보호**: 상세 페이지 초기 HTML에 번호를 절대 포함하지 않는다. "전화하기" 클릭 시에만 `revealPhone` Server Action으로 번호를 받아 즉시 tel: 연결. (HTML 소스에서 번호 긁기 방지) **+ revealPhone은 로그인 유저만 호출 가능**(미인증 시 거부)으로 대량 수집까지 차단.
- **소유자 검증**: 수정/삭제/거래완료 Server Action은 매번 `getUser()`로 본인 글인지 서버에서 재확인. UI 숨김만 믿지 않는다.
- **삭제 시 정리**: 글 삭제하면 연결된 **`item_images`·`item_categories`** 행과 Storage `item-images` 버킷의 실제 사진 파일까지 함께 삭제 (고아 데이터·고아 파일 방지). 운반옵션은 `items.transport_options` 컬럼이라 items 행 삭제 시 함께 사라짐(별도 정리 불필요).
- **없는 id**: `notFound()`로 404.
- **거래완료 글**: 상세는 보이되 "거래완료" 명확히 표시. 전화하기는 비활성 or 안내문.

---

## 8. 결정 사항 (3-A 진입 전 확정)

설계 9번 미결정 4개를 다음과 같이 확정했다(2026-06-04):

1. **전화걸기 = 로그인 유저만**
   - `revealPhone` Server Action에 인증 게이트. 미인증 호출은 거부.
   - 이유: revealPhone이 실제 번호를 반환하므로, 비로그인 허용 시 스크립트로 전 아이템 번호를 대량 수집 가능. "번호 화면 비노출" 설계 의도와 일치.

2. **수정 = 사진까지 편집** (삭제/추가/순서변경 포함)
   - `edit-item-form`은 기존 원격 사진(url) + 신규 로컬 사진(File)을 혼합 처리.
   - 저장 시 diff: 빠진 기존 사진 → `item_images` 행 + Storage 파일 삭제 / 새 사진 → 업로드 + insert / 최종 순서 → `display_order` 일괄 갱신.
   - `PhotoUploader`를 혼합 모델로 확장 필요. (13번 단계 부담 큼 — 너무 무거우면 "글 정보만 우선"으로 축소 가능)

3. **거래완료 = 목록에 회색으로 계속 노출** (카드 dim)
   - 숨기지 않고 dim 처리. 거래 활성도·신뢰감 유지(당근 등 관례).

4. **가격 표기 = 금액 + 협의 병기**
   - 판매중: `50,000원`
   - 협의(negotiable): `50,000원 · 협의 가능`
   - 나눔(free): `무료`
   - 구해요(request): `희망가 50,000원`

---

## 9. 완료 기준 (DoD)

**3-A (보는 흐름)**
- [ ] 메인이 아이템 목록으로 바뀜 (데모 본문 제거)
- [ ] 카드: 썸네일·제목·가격·지역·상태 배지 표시, 흰 카드
- [ ] 탭(전체/구해요/나눔/판매중) 동작
- [ ] 카드 클릭 → 상세로 이동
- [ ] 상세: 사진 스와이프, 제목·설명·지역·운반옵션·상태 표시
- [ ] "전화하기" 클릭 → 전화 앱 연결, 번호는 화면에 안 보임 (로그인 유저만)
- [ ] 없는 id → 404, 빈 목록 → 빈 화면

**3-B (관리 흐름)**
- [ ] 내 글이면 수정/삭제/거래완료 버튼 보임, 남의 글이면 안 보임
- [ ] 거래완료 → 회색 배지, 다시 거래중 토글
- [ ] 수정 → 폼에 기존 값 채워짐(사진 포함) → 저장 → 반영
- [ ] 삭제 → 확인 모달 → DB+Storage 정리 → 메인 복귀
- [ ] 비소유자가 `/items/[id]/edit` 직접 접근 → 막힘
- [ ] `protected-test` 페이지 제거됨

---

## 10. 작업 분할

### 3-A · 보는 흐름 (커밋 세이브 포인트)
1. `format.ts` 유틸 (가격/날짜 포맷)
2. `status-badge.tsx` (목록·상세 공유 배지)
3. `item-card.tsx` (카드 1개)
4. `item-list.tsx` + `page.tsx` 재구성 (목록 조회·렌더)
5. `type-tabs.tsx` (거래종류 필터)
6. `items/[id]/page.tsx` placeholder → 진짜 상세 (텍스트 정보)
7. `photo-gallery.tsx` (사진 스와이프)
8. `revealPhone` 액션 + `call-button.tsx` (전화 연결, 로그인 게이트)
9. 3-A 전체 수동 테스트 → **커밋**

### 3-B · 관리 흐름
10. `owner-controls.tsx` + 소유자 판정
11. `setItemStatus` 액션 (거래완료 토글)
12. `deleteItem` 액션 (DB+Storage 정리) + 삭제 확인 모달
13. `updateItem` 액션 + `edit/` 페이지·폼 (Phase 2 폼 재사용, 사진 편집 포함)
14. `protected-test` 제거
15. 3-B 전체 수동 테스트 → **커밋** → Phase 3 완료 일지
