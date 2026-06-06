"use client";

import { useState } from "react";

import { withdrawAccount } from "@/app/actions/account";

/**
 * 회원 탈퇴. (마이페이지 하단, 눈에 띄지 않게)
 *
 * 확인 모달에서 되돌릴 수 없음을 경고한 뒤 withdrawAccount 실행. 성공 시 서버가
 * signOut + 홈으로 redirect 하므로 이 컴포넌트로 제어가 돌아오지 않는다(돌아오면 에러).
 */
export function WithdrawButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setError(null);
    setBusy(true);
    const res = await withdrawAccount();
    // 성공이면 서버 redirect 로 이동 → 여기 도달 시 = 실패
    if (res?.error) {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <div className="pt-6 text-center">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground underline transition-colors hover:text-destructive"
      >
        회원 탈퇴
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xs rounded-base bg-background p-5 text-left shadow-lg">
            <p className="text-base font-semibold text-foreground">
              정말 탈퇴할까요?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              되돌릴 수 없어요. 등록한 매물·사진·채팅·조회기록 등 모든 데이터가
              영구 삭제됩니다.
            </p>

            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="flex-1 rounded-base border border-border bg-muted py-2 text-sm font-medium text-foreground disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={busy}
                className="flex-1 rounded-base bg-destructive py-2 text-sm font-medium text-destructive-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "탈퇴 중..." : "탈퇴"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
