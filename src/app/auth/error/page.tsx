type AuthErrorPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

type ErrorContent = {
  title: string;
  body: string;
};

function resolveContent(reason: string | undefined): ErrorContent {
  switch (reason) {
    case "state_expired":
      return {
        title: "로그인 시간이 만료됐어요",
        body: "다시 시도해주세요.",
      };
    case "denied":
      return {
        title: "카카오 로그인이 취소됐어요",
        body: "동의를 진행해야 짜투에 로그인할 수 있어요.",
      };
    case "exchange_failed":
      return {
        title: "로그인 중 오류가 발생했어요",
        body: "잠시 후 다시 시도해주세요.",
      };
    default:
      return {
        title: "로그인에 실패했어요",
        body: "잠시 후 다시 시도해주세요.",
      };
  }
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const { reason } = await searchParams;
  const { title, body } = resolveContent(reason);

  return (
    <main className="flex flex-1 items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-sm rounded-base bg-card px-8 py-10 text-center">
        <span className="inline-flex items-center rounded-full border border-destructive-border bg-destructive-bg px-3 py-1 text-xs font-medium text-destructive">
          로그인 실패
        </span>
        <h1 className="mt-6 text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <a
          href="/login"
          className="mt-8 inline-flex w-full items-center justify-center rounded-base bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          다시 로그인하기
        </a>
      </div>
    </main>
  );
}
