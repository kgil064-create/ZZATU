# Phase 1 · 카카오 로그인 화면 설계서

> 코드 작성 전 합의서. 만들 화면·라우팅·예외 처리를 글로 먼저 정리한다.
> 인프라(카카오 + Supabase 연동)는 [2026-05-30 셋업 일지](../devlog/2026-05-30-카카오-인프라-셋업.md)에서 완료됨.

---

## 1. 목표

사용자가 짜투에서 **카카오 계정으로 로그인**할 수 있고, **로그인 상태에 따라 화면이 달라진다**.

- 비로그인 상태에서도 자재 목록·상세는 볼 수 있다 (1차 짜투와 동일)
- 자재 등록·채팅·찜 같은 행위는 로그인이 필요하다
- 로그인 흐름은 최대한 짧고 끊김 없이 (3단계 안에 끝)

---

## 2. 사용자 시나리오

### 시나리오 A · 비로그인 사용자가 자재 등록을 시도

1. 메인 화면에서 "**자재 등록**" 버튼 누름
2. 로그인 안 됐으니 자동으로 `/login?redirect=/items/new` 로 이동
3. 로그인 페이지의 "카카오로 시작하기" 누름
4. 카카오 동의 화면 → 동의 → 짜투로 복귀
5. 콜백 처리 후 원래 가려던 `/items/new` 로 이동

### 시나리오 B · 처음 방문자가 로그인부터 함

1. 메인 화면 헤더의 "**로그인**" 클릭
2. `/login` 으로 이동
3. 카카오로 시작하기 → 동의 → 복귀
4. 콜백 처리 후 메인 `/` 로 이동

### 시나리오 C · 로그인 사용자가 로그아웃

1. 헤더 우측에 닉네임 표시됨 (예: "고길동")
2. 닉네임 또는 옆의 메뉴에서 "로그아웃" 클릭
3. 세션 삭제 → 메인 `/` 로 이동, 비로그인 상태로 표시

### 시나리오 D · 로그인 중간에 사용자가 동의 화면에서 너무 오래 멈춤

→ OAuth `state` 만료로 콜백이 실패함.
→ 짜투의 콜백 페이지에서 "로그인 시간이 만료됐어요. 다시 시도해주세요"를 보여주고 `/login` 으로 돌려보냄.

---

## 3. 만들 파일 목록

| 경로 | 종류 | 책임 |
|---|---|---|
| `src/app/login/page.tsx` | Server Component | 로그인 페이지 화면 |
| `src/app/login/login-button.tsx` | Client Component | 카카오 로그인 버튼 (클릭 시 OAuth 시작) |
| `src/app/auth/callback/route.ts` | Route Handler | 카카오에서 돌아온 `code` 를 세션으로 교환 |
| `src/app/auth/error/page.tsx` | Server Component | OAuth 실패 시 안내 화면 (state 만료 등) |
| `src/components/site-header.tsx` | Server Component | 상단 헤더 (로고·로그인 상태 표시) |
| `src/components/sign-out-button.tsx` | Client Component | 로그아웃 버튼 (Server Action 호출) |
| `src/app/actions/auth.ts` | Server Actions | `signOut()` 액션 |
| `src/lib/auth.ts` | 유틸 | `getUser()` 같은 인증 헬퍼 (로그인 강제용) |

---

## 4. 각 파일 책임 (상세)

### `src/app/login/page.tsx`
- Server Component
- 로그인된 사용자가 들어오면 `redirect` 파라미터의 경로(기본 `/`)로 즉시 리다이렉트 (이미 로그인이면 로그인 페이지 보일 이유 없음)
- 짜투 로고 + "자재의 가치를 잇다" + 카카오 버튼
- `redirect` 쿼리 파라미터를 `<LoginButton>` 에 props 로 전달

### `src/app/login/login-button.tsx`
- Client Component (`"use client"`)
- props: `redirect?: string`
- 클릭 시 브라우저 Supabase 클라이언트의 `auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: '...auth/callback?next=<redirect>' } })` 호출
- 디자인: 카카오 공식 가이드 준수 — **노란색 `#FEE500` 배경, 검정 텍스트, 카카오 심볼 + "카카오로 시작하기"**

### `src/app/auth/callback/route.ts`
- Next.js Route Handler (`GET`)
- 카카오 → Supabase → 짜투로 돌아오는 최종 착륙 지점
- 쿼리: `code` (Supabase 교환용), `next` (원래 가려던 경로)
- 처리 순서:
  1. `code` 가 없거나 `error` 가 있으면 `/auth/error?reason=state_expired` 로 리다이렉트
  2. `supabase.auth.exchangeCodeForSession(code)` 호출
  3. 성공이면 `next` 또는 `/` 로 리다이렉트
  4. 실패면 `/auth/error?reason=exchange_failed` 로

### `src/app/auth/error/page.tsx`
- 실패 사유별 짧은 안내 + "다시 로그인하기" 버튼
- `reason` 쿼리 파라미터:
  - `state_expired` → "로그인 시간이 만료됐어요. 다시 시도해주세요"
  - `exchange_failed` → "로그인 중 오류가 발생했어요"
  - 그 외 → 기본 메시지

### `src/components/site-header.tsx`
- Server Component
- 좌측: ZZATU 로고 (홈 링크)
- 우측 (로그인 상태에 따라):
  - **비로그인**: "로그인" 링크 (`/login`)
  - **로그인**: 닉네임 + `<SignOutButton />`
- 1차 짜투의 헤더 구성 그대로 (등록하기 / 닉네임 / 로그아웃 순서) 단, 등록하기 버튼은 Phase 2에서 추가

### `src/components/sign-out-button.tsx`
- Client Component
- `signOut` Server Action 을 호출하는 `<form action={signOut}>` 안의 버튼

### `src/app/actions/auth.ts`
```
'use server'
export async function signOut() {
  서버 클라이언트로 supabase.auth.signOut() 호출
  redirect('/')
}
```

### `src/lib/auth.ts`
- `getUser()` — 현재 로그인 사용자를 가져오는 헬퍼 (서버 컴포넌트에서 사용)
- `requireUser(redirectTo)` — 로그인 안 됐으면 `/login?redirect=<현재경로>` 로 보내는 가드. 자재 등록 같은 보호 페이지에서 사용

---

## 5. 라우팅 한눈에

| 경로 | 메서드 | 비로그인 접근 | 로그인 접근 |
|---|---|---|---|
| `/` | GET | OK | OK |
| `/login` | GET | OK | → `redirect` 로 자동 이동 |
| `/auth/callback` | GET | OK (OAuth 진행 중) | OK |
| `/auth/error` | GET | OK | OK |

---

## 6. 디자인 토큰 활용

| 영역 | 토큰 | 비고 |
|---|---|---|
| 카카오 버튼 배경 | `#FEE500` (하드코드) | 카카오 가이드에 따라 토큰화하지 않음 |
| 카카오 버튼 텍스트 | `#000000` rgba(0,0,0,0.85) | 카카오 가이드 |
| 로그인 페이지 배경 | `bg-muted` | 메인과 같은 옅은 회색 |
| 헤더 배경 | `bg-background` | 흰색, 하단에 `border-b border-border` |
| 헤더 로고 텍스트 | `text-primary` | 차콜 블랙 |
| 닉네임 / 로그아웃 텍스트 | `text-muted-foreground` + hover 시 `text-foreground` | 1차 톤 |
| 에러 박스 | `bg-destructive-bg border-destructive-border` | 시스템 토큰 |

---

## 7. 예외 처리 · 보안

1. **state 만료** — `/auth/error?reason=state_expired` 로 처리. 1번 자동 재시도 없음 (사용자 클릭 유도).
2. **카카오 사용자 거부** (동의 화면에서 "취소") — `error=access_denied` 파라미터로 콜백 호출됨. `/auth/error?reason=denied` 처리, 별도 안내문.
3. **세션 유지** — Supabase 가 쿠키로 자동 처리. 우리 `proxy.ts` 가 매 요청마다 갱신.
4. **로그아웃 시 캐시 오염 방지** — 로그아웃 후 `/` 리다이렉트 시 `revalidatePath('/')` 또는 `router.refresh()` 패턴 검토.
5. **redirect 파라미터 검증** — `redirect=https://나쁜사이트.com` 같은 외부 URL 방지. **상대 경로(`/`로 시작)만 허용**하고 그 외엔 무시 → `/`로 보냄.

---

## 8. 완료 기준 (DoD · Definition of Done)

이 단계가 끝났다고 말하려면 아래가 모두 동작해야 한다.

- [ ] `/login` 접속 → 카카오 버튼 보임
- [ ] 버튼 클릭 → 카카오 동의 화면 → 동의 → 짜투로 복귀 → 로그인됨
- [ ] 로그인 후 헤더에 닉네임이 보임
- [ ] 헤더의 로그아웃 클릭 → 비로그인 상태로 돌아옴
- [ ] 비로그인 상태에서 `/items/new` (또는 보호 경로) 접속 → `/login` 으로 리다이렉트
- [ ] 로그인 페이지를 `/login?redirect=/items/new` 로 들어가서 로그인 → `/items/new` 로 도착
- [ ] 카카오 동의 화면에서 "취소" 누르면 에러 페이지로 이동
- [ ] 로그인된 상태로 `/login` 접속 → 자동으로 메인으로 이동

> ※ "보호 경로 자체"는 Phase 2 (자재 등록 화면 만들 때) 같이 작업. 이번 Phase 1 은 헤더에 임시 "보호 페이지 테스트" 링크 하나 두고 가드만 검증해도 됨.

---

## 9. 의문점 · 미결정 (코드 작성 단계에서 결정할 것)

- **카카오 버튼 위치** — 로그인 페이지에서만 노출 vs 헤더에도 작게 노출? → 1차 짜투처럼 헤더의 텍스트 링크 "로그인" 한 줄로 가는 게 깔끔. 카카오 버튼은 `/login` 페이지에만.
- **닉네임 표시 길이** — 카카오 닉네임이 길면 헤더에서 잘릴 수 있음 → max-width + ellipsis.
- **소셜 로그인 추가 확장 여지** — 일단 카카오만. 네이버·구글은 Phase 4 이후 검토. 코드 구조는 "카카오 외 추가 가능" 형태로 두되 지금 추상화는 안 함.

---

## 10. 작업 분할 (실제 코딩 시 순서 제안)

1. `site-header.tsx` 골격 (로그인 상태 미반영, 로고만)
2. `lib/auth.ts` 의 `getUser()` 헬퍼
3. `login/page.tsx` + `login/login-button.tsx`
4. `auth/callback/route.ts` (가장 트리키, 한 번에 검증)
5. `auth/error/page.tsx`
6. 헤더에 로그인 상태 반영 (닉네임 / 로그아웃 버튼)
7. `actions/auth.ts` + `sign-out-button.tsx`
8. `lib/auth.ts` 의 `requireUser()` 가드 + 테스트용 보호 경로 한 개
9. 완료 기준 체크리스트 전체 수동 테스트
