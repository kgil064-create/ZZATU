// Phase 2 임시 placeholder. 실제 상세 페이지는 추후 Phase에서 구현.
//
// Next 16 동적 라우트 규약: params 는 Promise 이므로 await 후 사용한다.
// (node_modules/next/dist/docs/.../dynamic-routes.md 확인)

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">자재 상세 페이지</h1>
      <div className="mt-4 rounded-base bg-muted p-4">
        <p className="text-sm text-muted-foreground">자재 ID</p>
        <p className="mt-1 font-mono">{id}</p>
      </div>
      <p className="mt-6 text-muted-foreground">
        상세 페이지는 추후 Phase에서 구현됩니다.
      </p>
      <a
        href="/items/new"
        className="mt-4 inline-block text-primary hover:underline"
      >
        ← 자재 등록 페이지로 돌아가기
      </a>
    </div>
  );
}
