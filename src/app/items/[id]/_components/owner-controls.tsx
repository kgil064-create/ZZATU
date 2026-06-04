"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { deleteItem, setItemStatus } from "@/app/actions/items";

/**
 * 내 글일 때만 보이는 관리 버튼. (Phase 3 · 묶음 4)
 *
 * 소유자 판정은 서버(상세 page)에서 끝내고, 이 컴포넌트는 소유자에게만 렌더된다.
 * 액션 자체도 서버에서 소유자를 재검증하므로 UI 노출만으로 보안을 처리하지 않는다.
 * 이번 단계는 거래완료 토글 + 삭제만(수정 버튼은 묶음 5).
 */
export function OwnerControls({
  itemId,
  isSold,
}: {
  itemId: string;
  isSold: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleStatus() {
    setError(null);
    setBusy(true);
    const res = await setItemStatus(itemId, !isSold);
    setBusy(false);
    if (!res.success) {
      setError(res.error ?? "상태 변경에 실패했어요");
      return;
    }
    router.refresh();
  }

  async function confirmDelete() {
    setError(null);
    setBusy(true);
    const res = await deleteItem(itemId);
    if (!res.success) {
      setBusy(false);
      setConfirmOpen(false);
      setError(res.error ?? "삭제에 실패했어요");
      return;
    }
    // 성공 → 메인으로 이동(busy 유지: 화면 전환까지 버튼 잠금)
    router.push("/");
  }

  return (
    <div className="rounded-base border border-border bg-card p-3">
      <div className="flex gap-2">
        <Link
          href={`/items/${itemId}/edit`}
          className="flex-1 rounded-base border border-border bg-muted py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          수정
        </Link>
        <button
          type="button"
          onClick={toggleStatus}
          disabled={busy}
          className="flex-1 rounded-base border border-border bg-muted py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSold ? "다시 거래중으로" : "거래완료로 변경"}
        </button>
      </div>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
        className="mt-2 w-full rounded-base border border-destructive-border bg-destructive-bg py-2 text-sm font-medium text-destructive transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        삭제
      </button>

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xs rounded-base bg-background p-5 shadow-lg">
            <p className="text-base font-semibold text-foreground">
              정말 삭제할까요?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              되돌릴 수 없어요.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
                className="flex-1 rounded-base border border-border bg-muted py-2 text-sm font-medium text-foreground disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busy}
                className="flex-1 rounded-base bg-destructive py-2 text-sm font-medium text-destructive-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
