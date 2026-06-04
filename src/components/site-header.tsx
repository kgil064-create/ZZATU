import { getProfile } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

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
        <a href="/" className="flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight text-primary">
            ZZATU
          </span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            자재의 가치를 잇다
          </span>
        </a>
        <nav className="flex items-center gap-3">
          {profile ? (
            <>
              <span className="max-w-[120px] truncate text-sm text-foreground">
                {profile.nickname}
              </span>
              <a
                href="/chat"
                aria-label="채팅"
                title="채팅"
                className="text-primary transition-colors hover:text-primary-hover"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </a>
              <a
                href="/mypage"
                aria-label="마이페이지"
                title="마이페이지"
                className="text-primary transition-colors hover:text-primary-hover"
              >
                <svg
                  width="22"
                  height="22"
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
              </a>
              <SignOutButton />
            </>
          ) : (
            <a
              href="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              로그인
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
