import Link from "next/link";

import { getProfile } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { HeaderBackButton } from "@/components/header-back-button";

/**
 * SiteHeader 의 Suspense fallback.
 *
 * 세션 조회(getProfile)를 기다리는 동안 먼저 그려진다. 실제 헤더와 **동일한**
 * 골격(border-b + 내부 h-14 컨테이너)을 그대로 복제해야 교체 시점에 레이아웃
 * 시프트가 생기지 않는다 — 두 곳의 높이 클래스를 함께 고쳐야 한다.
 * 좌측 브랜드는 세션과 무관하므로 진짜 내용을 그대로 보여주고,
 * 로그인 여부에 따라 달라지는 우측만 자리표시자로 둔다.
 */
export function SiteHeaderSkeleton() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-screen-md items-center justify-between px-4">
        <div className="flex items-center gap-1">
          <HeaderBackButton />
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">
              ZZATU
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              자재의 가치를 잇다
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2" aria-hidden="true">
          <div className="h-4 w-16 animate-pulse rounded-md bg-border" />
          <div className="h-6 w-6 animate-pulse rounded-full bg-border" />
        </div>
      </div>
    </header>
  );
}

/**
 * 짜투(ZZATU) 사이트 공통 헤더.
 *
 * 로그인 상태에 따라 우측이 "로그인" 링크 또는 "닉네임 + 마이 + 로그아웃" 으로 바뀐다.
 * 닉네임은 profiles.nickname 단일 소스에서 읽는다(Phase 4 일원화) — 마이페이지의
 * 닉네임 수정이 헤더에도 즉시 반영된다.
 */
export async function SiteHeader() {
  const profile = await getProfile();

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-screen-md items-center justify-between px-4">
        <div className="flex items-center gap-1">
          <HeaderBackButton />
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">
              ZZATU
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              자재의 가치를 잇다
            </span>
          </Link>
        </div>
        <nav className="flex items-center gap-1">
          {profile ? (
            <>
              <span className="mr-1 max-w-[120px] truncate text-sm text-foreground">
                {profile.nickname}
              </span>
              <Link
                href="/mypage"
                aria-label="마이페이지"
                title="마이페이지"
                className="-mr-1 flex h-11 w-11 items-center justify-center text-primary transition-colors hover:text-primary-hover"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
