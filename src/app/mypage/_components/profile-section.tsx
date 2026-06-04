"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateNickname } from "@/app/actions/profile";

/**
 * 프로필 표시 + 닉네임 인라인 수정. (Phase 4)
 *
 * 사진은 기본 아바타(인라인 SVG)만 — 카카오 이미지·avatar 컬럼은 쓰지 않는다(결정 #1).
 * "수정" → 인라인 input(2~20자) → updateNickname → router.refresh()로 헤더·프로필 반영.
 */
export function ProfileSection({ nickname }: { nickname: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nickname);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setValue(nickname);
    setError(null);
    setEditing(true);
  }

  async function save() {
    const trimmed = value.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setError("닉네임은 2~20자로 입력해주세요");
      return;
    }
    setError(null);
    setBusy(true);
    const res = await updateNickname(trimmed);
    setBusy(false);
    if (!res.success) {
      setError(res.error ?? "닉네임 변경에 실패했어요");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="rounded-base border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>

        {editing ? (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={20}
            autoFocus
            className="min-w-0 flex-1 rounded-base border border-input px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate text-base font-medium text-foreground">
            {nickname}
          </span>
        )}

        {editing ? (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="rounded-base bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {busy ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={busy}
              className="rounded-base border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-50"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="shrink-0 rounded-base border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            수정
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
