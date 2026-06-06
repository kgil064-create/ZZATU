/**
 * 사이트 공통 푸터. 약관·개인정보처리방침 링크를 노출한다.
 *
 * body 가 min-h-full flex flex-col 이라 mt-auto 로 하단에 붙는다.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto flex max-w-screen-md flex-wrap items-center gap-x-4 gap-y-1 px-4 py-4 text-xs text-muted-foreground">
        <span>짜투(ZZATU)</span>
        <a href="/terms" className="transition-colors hover:text-foreground">
          이용약관
        </a>
        <a href="/privacy" className="transition-colors hover:text-foreground">
          개인정보처리방침
        </a>
      </div>
    </footer>
  );
}
