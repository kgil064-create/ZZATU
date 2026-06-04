# 짜투 (ZZATU) — 제주 건축자재 중고 거래 플랫폼

제주 지역의 건축자재를 중고로 사고팔 수 있는 모바일 웹 플랫폼입니다.
"자재의 가치를 잇다" — 남는 자재를 필요한 사람에게 잇는 것을 목표로 합니다.

> **현재 상태:** Phase 1~3 완료 (로그인 · 자재 등록 · 목록/상세/거래 관리). 다음은 Phase 4(마이페이지).

---

## 프로젝트 개요

- **프로젝트명:** 짜투 (ZZATU)
- **목적:** 제주 지역 건축자재 중고 거래 플랫폼 (모바일 우선)
- **시작일:** 2026-04-26
- **대상:** 현장에서 휴대폰으로 자재를 올리고 찾는 사용자

---

## 주요 기능

**구현 완료**
- 카카오 로그인 / 로그아웃, 보호 경로 가드
- 자재 등록 — 거래종류(구해요·나눔·판매중)별 폼, 다중 사진, 카테고리·지역·운반옵션, 전화번호
- 자재 목록 — 거래종류 탭 필터, 거래상태 색 배지, 카드 썸네일
- 자재 상세 — 사진 스와이프 갤러리, 전화 연결(로그인 게이트 · 번호 비노출)
- 거래 관리 — 본인 글 거래완료 토글 / 수정(사진 편집 포함) / 삭제

**예정**
- 마이페이지 (내 글 목록 · 최근 본 글)
- 목록 필터 확장 (카테고리 · 지역)
- 채팅 / 거래 문의

---

## 기술 스택

| 구분 | 기술 |
|---|---|
| 프론트엔드 | Next.js (App Router) · TypeScript · Tailwind CSS |
| 백엔드 / DB | Supabase (PostgreSQL · Auth · Storage) |
| 인증 | 카카오 OAuth (Supabase Auth) |
| 패키지 관리 | pnpm |
| 호스팅 | (미정) |

**디자인:** 메인 색은 제주 바다 청록빛 "함덕 딥블루"(`#0E7C8C`).
거래상태 색 — 구해요=파랑, 나눔=초록, 판매중=딥블루, 거래완료=회색.

---

## 프로젝트 구조

```
ZZATU/
├── src/
│   ├── app/                # Next.js App Router (페이지·라우트)
│   │   ├── page.tsx        # 메인 — 자재 목록
│   │   ├── login/          # 카카오 로그인
│   │   ├── auth/           # OAuth 콜백·에러
│   │   ├── items/          # 자재 등록(new)·상세([id])·수정(edit)
│   │   └── actions/        # Server Actions
│   ├── components/         # 공통 컴포넌트 (헤더·상태 배지 등)
│   └── lib/                # 헬퍼 (auth·format·supabase 등)
├── supabase/migrations/    # DB 스키마·RLS·시드 SQL (번호순 실행)
├── docs/                   # 설계서(specs) · 작업 일지(devlog)
├── public/                 # 정적 파일
└── .env.example            # 환경변수 템플릿 (실제 값은 .env.local)
```

---

## 개발 환경 설정

### 사전 요구사항
- Node.js 20+
- pnpm
- Supabase 프로젝트 (DB · Auth · Storage)

### 설치 및 실행
```
# 1. 저장소 클론
git clone <repository-url>
cd ZZATU

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
#    .env.example을 복사해 .env.local 생성 후 값 채우기
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# 4. 개발 서버 실행
pnpm dev
#    → http://localhost:3000
```

### 데이터베이스
`supabase/migrations/`의 SQL 파일을 **번호 순서대로** Supabase SQL Editor에서 실행하면
테이블·RLS·초기 데이터(카테고리·제주 읍면동·운반옵션)가 구성됩니다.

---

## 진행 기록

단계별 설계서는 `docs/specs/`, 완료 일지는 `docs/devlog/`에 정리돼 있습니다.

- **Phase 1** — 카카오 로그인 / 인증 가드
- **Phase 2** — 자재 등록
- **Phase 3** — 자재 목록 · 상세 · 거래 관리
- **Phase 4** (예정) — 마이페이지

---

## 작성자 / 연락
- kgil064@gmail.com

---

## 라이선스
비공개 / 사내용으로 시작, 추후 결정.
