import { getUser } from "@/lib/auth";

/**
 * 짜투(ZZATU) 사이트 공통 헤더.
 *
 * 로그인 상태에 따라 우측이 "로그인" 링크 또는 "닉네임 + 로그아웃" 으로 바뀐다.
 * 로그아웃 버튼은 자리만 잡아둔 상태이며, 진짜 Server Action 연결은
 * Phase 1 의 7단계에서 SignOutButton 컴포넌트로 교체한다.
 */
export async function SiteHeader() {
  const user = await getUser();

  // 카카오 동의에서 받은 닉네임이 우선, 없으면 이메일을 폴백으로 사용.
  const meta = user?.user_metadata as
    | { full_name?: string; name?: string }
    | undefined;
  const nickname = meta?.full_name ?? meta?.name ?? user?.email ?? null;

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
          {user ? (
            <>
              <span className="max-w-[120px] truncate text-sm text-foreground">
                {nickname}
              </span>
              {/* TODO: 7단계에서 SignOutButton 컴포넌트로 교체 (Server Action 연결) */}
              <button
                type="button"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                로그아웃
              </button>
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
