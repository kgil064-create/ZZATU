/**
 * 짜투(ZZATU) 사이트 공통 헤더.
 *
 * 로그인 상태 반영(닉네임 표시·로그아웃 버튼)은 Phase 1 의 6단계에서 추가한다.
 * 지금은 좌측 로고/태그라인과 우측 자리만 잡아둔 골격이다.
 */
export function SiteHeader() {
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
        <nav />
      </div>
    </header>
  );
}
