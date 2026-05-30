import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const [categoriesResult, regionsResult, transportResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, code, name")
      .order("display_order"),
    supabase
      .from("regions")
      .select("id, si, eupmyeondong", { count: "exact" }),
    supabase
      .from("transport_options")
      .select("code, name")
      .order("display_order"),
  ]);

  const ok =
    !categoriesResult.error && !regionsResult.error && !transportResult.error;

  return (
    <main className="min-h-screen bg-muted px-6 py-16">
      <div className="mx-auto max-w-2xl space-y-10">
        <header>
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            ZZATU
          </h1>
          <p className="mt-2 text-muted-foreground">
            짜투 · 자재의 가치를 잇다
          </p>
        </header>

        <section
          className={`rounded-xl border p-5 ${
            ok
              ? "border-success-border bg-success-bg"
              : "border-destructive-border bg-destructive-bg"
          }`}
        >
          <h2 className="text-lg font-semibold text-foreground">
            {ok ? "✅ Supabase 연결 성공" : "❌ Supabase 연결 실패"}
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>
              카테고리: {categoriesResult.error
                ? `에러 — ${categoriesResult.error.message}`
                : `${categoriesResult.data?.length}개 로드`}
            </li>
            <li>
              읍면동: {regionsResult.error
                ? `에러 — ${regionsResult.error.message}`
                : `${regionsResult.count}개 로드`}
            </li>
            <li>
              운반옵션: {transportResult.error
                ? `에러 — ${transportResult.error.message}`
                : `${transportResult.data?.length}개 로드`}
            </li>
          </ul>
        </section>

        {categoriesResult.data && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              카테고리
            </h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categoriesResult.data.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <div className="font-medium text-card-foreground">
                    {c.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{c.code}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {transportResult.data && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              운반 옵션
            </h2>
            <ul className="flex flex-wrap gap-2">
              {transportResult.data.map((t) => (
                <li
                  key={t.code}
                  className="rounded-full border border-border bg-card px-3 py-1 text-sm text-card-foreground"
                >
                  {t.name}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
