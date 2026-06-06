import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth";

import { LoginButton } from "./login-button";

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

/**
 * 외부 URL 차단. 상대 경로(`/`로 시작, `//` 제외)만 통과.
 * 그 외에는 무시하고 `/` 로 대체. (설계서 7-5 redirect 검증 정책)
 */
function sanitizeRedirect(raw: string | undefined): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect: rawRedirect } = await searchParams;
  const safeRedirect = sanitizeRedirect(rawRedirect);

  // 이미 로그인되어 있으면 로그인 페이지 보일 이유가 없으므로 바로 이동.
  const user = await getUser();
  if (user) {
    redirect(safeRedirect);
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-sm rounded-base bg-card px-8 py-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          ZZATU
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          자재의 가치를 잇다
        </p>
        <div className="mt-8">
          <LoginButton redirect={safeRedirect} />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          로그인 시{" "}
          <a href="/terms" className="underline hover:text-foreground">
            이용약관
          </a>{" "}
          및{" "}
          <a href="/privacy" className="underline hover:text-foreground">
            개인정보처리방침
          </a>
          에 동의한 것으로 봅니다.
        </p>
      </div>
    </main>
  );
}
