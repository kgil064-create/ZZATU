import { requireUser } from "@/lib/auth";

/**
 * requireUser() 가드 동작 검증용 임시 페이지.
 * Phase 2 에서 자재 등록 등 실제 보호 경로가 만들어지면 삭제할 것.
 */
export default async function ProtectedTestPage() {
  const user = await requireUser("/protected-test");

  const meta = user.user_metadata as
    | { full_name?: string; name?: string }
    | undefined;
  const nickname = meta?.full_name ?? meta?.name ?? user.email ?? "회원";

  return (
    <main className="min-h-screen bg-muted px-6 py-16">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            보호된 페이지
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            이 페이지는 로그인한 사용자만 볼 수 있어요.
          </p>
        </header>

        <section className="rounded-base bg-card px-6 py-5">
          <p className="text-base text-foreground">
            <span className="font-semibold">{nickname}</span>님, 환영합니다.
          </p>
        </section>

        <section className="rounded-base bg-card px-6 py-5 text-sm text-muted-foreground">
          로그아웃 후 이 페이지에 다시 접근하면{" "}
          <code className="rounded bg-muted px-1 text-xs">
            /login?redirect=/protected-test
          </code>{" "}
          로 자동으로 튕깁니다.
        </section>

        <a
          href="/"
          className="inline-flex items-center justify-center rounded-base bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          메인으로 돌아가기
        </a>
      </div>
    </main>
  );
}
