# Phase 4 · 마이페이지 설계서

> 코드 작성 전 합의서. Phase 1~3의 인증/카드/상세를 재사용해 "나" 공간을 만든다.
> ⚠️ 실제 스키마 확인 반영: `profiles`에 **사진 컬럼 없음**(닉네임은 `nickname`, 가입 시
>   `handle_new_user()` 트리거가 카카오 name 으로 자동 생성). 현재 헤더 닉네임은
>   `user_metadata`에서 읽지만 → **이번 Phase 에서 `profiles.nickname`으로 일원화**한다.

---

## 1. 목표

로그인한 사용자가 한 곳에서 **(1) 내가 올린 글 모아보기, (2) 최근 본 글 다시 찾기, (3) 내 프로필 확인·닉네임 수정**을 할 수 있다.

- 진입점: 헤더의 **'마이' 아이콘**(로그인 시 노출)
- 최근 본 글은 **Supabase DB에 저장**(계정 기준, 기기 바뀌어도 유지)
- 관리(거래완료/수정/삭제)는 Phase 3 상세 페이지 재사용 — 마이페이지 목록은 "모아보기 + 상세로 이동"

---

## 2. 사용자 시나리오

### A · 내 판매 현황 확인
1. 헤더 '마이' 아이콘 클릭 → `/mypage`
2. 상단에 내 프로필(닉네임·기본 아바타), 아래에 "내가 올린 글" 목록
3. 거래완료된 글은 회색 dim으로 구분, 카드 클릭 → 상세 → 거기서 거래완료/수정/삭제

### B · 봤던 글 다시 찾기
1. 자재 상세를 보면 자동으로 "최근 본 글"에 기록됨(로그인 시)
2. 마이페이지 "최근 본 글" 섹션에 최신순으로 표시
3. 같은 글 다시 보면 중복 안 생기고 맨 위로 올라옴

### C · 닉네임 변경
1. 마이페이지 프로필 영역 "수정" → 닉네임 입력 → 저장
2. 헤더·프로필에 새 닉네임 즉시 반영 (둘 다 `profiles.nickname`을 읽음)

### D · 예외
- 비로그인 `/mypage` 접근 → 로그인으로 가드
- 최근 본 글 중 **삭제된 자재**는 목록에서 자동으로 빠짐
- 내가 올린 글이 없으면 "아직 올린 자재가 없어요" 빈 화면

---

## 3. 만들 파일 목록

| 경로 | 종류 | 책임 |
|---|---|---|
| `supabase/migrations/06_item_views.sql` | SQL | `item_views` 테이블 + RLS (05 다음 번호) |
| `src/app/mypage/page.tsx` | Server Component | requireUser + 프로필·내 글·최근 본 글 조회 |
| `src/app/mypage/_components/profile-section.tsx` | Client Component | 프로필 표시(기본 아바타) + 닉네임 수정 |
| `src/app/mypage/_components/my-items.tsx` | Server Component | 내가 올린 글 목록 (item-card 재사용) |
| `src/app/mypage/_components/recent-views.tsx` | Server Component | 최근 본 글 목록 (item-card 재사용) |
| `src/app/actions/profile.ts` | Server Actions | `updateNickname` |
| `src/app/actions/views.ts` | Server Actions | `recordView` |
| `src/app/items/[id]/_components/record-view.tsx` | Client Component | 상세 진입 시 조회 기록 |

**수정할 파일:**
- `src/components/site-header.tsx` — (a) 로그인 시 '마이' 아이콘(→ `/mypage`) 추가, (b) **닉네임 소스를 `user_metadata` → `profiles.nickname`으로 전환**
- `src/app/items/[id]/page.tsx` — 로그인 + 본인 글 아님일 때 `<RecordView />` 렌더

---

## 4. 각 파일 책임 (핵심)

- **`item_views` 테이블:** `(user_id, item_id)` 복합 PK → 재조회는 upsert로 `viewed_at`만 갱신(중복 방지). 두 FK 모두 `on delete cascade`(글·계정 삭제 시 자동 정리).
- **mypage/page:** `requireUser`. 프로필(`profiles.nickname`), 내 글(`items where user_id = 나`), 최근 본 글(`item_views` join `items`, viewed_at desc, LIMIT 30) 조회 → 각 섹션에 전달.
- **profile-section:** **기본 아바타(인라인 아이콘/이니셜 원형)** + 닉네임 표시. 카카오 사진은 쓰지 않고 avatar 컬럼도 두지 않는다. "수정" 토글 → 인라인 input → `updateNickname` 호출(별도 라우트 X).
- **site-header:** 로그인 시 '마이' 아이콘 추가. 닉네임은 `getUser()` 후 **`profiles.nickname`을 조회**해 표시(기존 `user_metadata` 폴백 제거). 초기 닉네임은 트리거가 넣은 카카오 name 이라 기존 표시와 동일 → 시각 회귀 없음.
- **my-items / recent-views:** 둘 다 `item-card` 재사용. 정렬 — 내 글은 거래완료 뒤로+최신순, 최근 본 글은 viewed_at desc.
- **record-view:** 마운트 시 `recordView(itemId)` 한 번 호출(fire-and-forget). 상세 page에서 **로그인 + 본인 글 아닐 때만** 렌더.
- **recordView 액션:** 서버 `getUser()` → 본인 글이면 기록 안 함 → `item_views` upsert(`on conflict (user_id,item_id) do update set viewed_at=now()`).
- **updateNickname 액션:** 서버 `getUser()` → 본인 `profiles`만 수정 → 길이 검증(2~20자, trim) → revalidate(헤더·마이페이지).

---

## 5. 라우팅

| 경로 | 설명 | 가드 |
|---|---|---|
| `/mypage` | 마이페이지 | `requireUser` (비로그인 → 로그인) |

닉네임 수정은 별도 라우트 없이 마이페이지 안에서 인라인 처리.

---

## 6. 디자인 토큰 활용

- 헤더 '마이' 아이콘 — primary(함덕 딥블루) 톤, 사람/프로필 아이콘
- 프로필 영역 — 흰 카드, **기본 아바타 원형**(generic), 닉네임 보통 크기
- 내 글·최근 본 글 — Phase 3 카드/배지 그대로 재사용(흰 카드, 거래상태 색, 거래완료 dim)
- 섹션 제목("내가 올린 글", "최근 본 글") — 깔끔한 소제목

---

## 7. 예외 / 보안

- **RLS:** `item_views`는 본인 것만 select/insert/update/delete (`user_id = auth.uid()`).
- **조회 기록:** 로그인 유저만, 본인 글은 제외(내 글 목록과 중복 방지), upsert로 중복 행 없음.
- **닉네임 수정:** 서버에서 본인 프로필만, 길이 검증(2~20자), 빈 값 거부.
- **삭제된 글:** 최근 본 글 join에서 자동 제외(item 없으면 안 보임). FK cascade로 행도 정리됨.
- **`/mypage`:** requireUser 가드.

---

## 8. 결정 사항 (4-A 진입 전 확정)

설계 9번 미결정 + 스키마 충돌 해소를 다음과 같이 확정했다(2026-06-04):

1. **프로필 사진 = 기본 아바타만**
   - 카카오 실제 프로필 사진 사용 X, `profiles`에 avatar 컬럼 추가 X, 업로드 X.
   - 닉네임 옆에 generic 원형 아바타(인라인 아이콘/이니셜)만 표시. (추후 도입 여지)

2. **닉네임 소스 = `profiles.nickname` 일원화 (헤더 포함)**
   - 헤더·마이페이지 모두 `profiles.nickname`을 읽도록 전환. `updateNickname` 수정이 헤더에 즉시 반영(DoD 충족). 헤더에 profiles 조회 1회 추가.

3. **내 글 상태 탭** — 넣지 않음. **단일 목록**(거래완료 dim+뒤로).

4. **최근 본 글 개수/정리** — **LIMIT 30**, pruning 은 나중.

5. **마이페이지 목록 인라인 관리** — 넣지 않음. 관리(거래완료/수정/삭제)는 **상세에서**(Phase 3 재사용).

---

## 9. 완료 기준 (DoD)

**4-A (마이페이지 + 내 글 + 프로필)**
- [ ] 로그인 시 헤더에 '마이' 아이콘 → `/mypage` 이동
- [ ] 비로그인 `/mypage` 접근 → 로그인 가드
- [ ] 프로필(닉네임·기본 아바타) 표시
- [ ] 닉네임 수정 → 저장 → 헤더·프로필 반영
- [ ] 내가 올린 글 목록 표시(없으면 빈 화면), 카드 클릭 → 상세
- [ ] 거래완료 글은 회색 dim 구분

**4-B (최근 본 글)**
- [ ] `item_views` 테이블 + RLS 생성
- [ ] 자재 상세 보면(로그인·남의 글) → 최근 본 글에 기록
- [ ] 마이페이지 "최근 본 글" 최신순 표시
- [ ] 같은 글 재조회 → 중복 없이 맨 위로(viewed_at 갱신)
- [ ] 본인 글 조회는 최근 본 글에 안 들어감
- [ ] 삭제된 글은 최근 본 글에서 안 보임

---

## 10. 작업 분할

### 4-A · 마이페이지 + 내 글 + 프로필 (커밋 세이브 포인트)
1. 헤더에 '마이' 아이콘/링크 (로그인 시) + 닉네임 소스 `profiles.nickname` 전환
2. `mypage/page.tsx`(requireUser) + `my-items.tsx`(내 글 목록)
3. `profile-section.tsx`(프로필 표시 — 기본 아바타)
4. `profile.ts`의 `updateNickname` + 닉네임 수정 UI
5. 4-A 수동 테스트 → **커밋**

### 4-B · 최근 본 글
6. `06_item_views.sql`(테이블+RLS) — Supabase에서 실행
7. `recordView` 액션 + `record-view.tsx`(상세에서 기록)
8. `recent-views.tsx` + `page.tsx`에 연결
9. 4-B 수동 테스트 → **커밋** → Phase 4 완료 일지
