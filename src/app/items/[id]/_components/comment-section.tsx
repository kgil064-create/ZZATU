"use client";

import { useState, type SyntheticEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createComment, deleteComment } from "@/app/actions/comments";
import { COMMENT_MAX_LENGTH } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format";

export interface ItemComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  nickname: string | null;
}

/**
 * 매물 댓글. (Phase: 댓글 · '구해요'에만 노출 — 노출 판정은 상세 page 가 한다)
 *
 * Realtime 은 쓰지 않는다. 작성·삭제 후 서버 액션의 revalidatePath + router.refresh()
 * 로 목록을 다시 받는다(채팅과 다른 선택 — 댓글은 실시간성이 필요 없다).
 *
 * 비로그인도 목록은 그대로 보고, 입력창 자리에만 로그인 유도 버튼이 놓인다
 * (RLS 의 comments_select_all 과 같은 방침).
 * 수정 기능은 없다 — DB 에 update 정책 자체가 없다(삭제 후 재작성).
 */
export function CommentSection({
  itemId,
  ownerId,
  myId,
  comments,
}: {
  itemId: string;
  ownerId: string;
  myId: string | null;
  comments: ItemComment[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const loginHref = `/login?redirect=${encodeURIComponent(`/items/${itemId}`)}`;

  async function submit(e: SyntheticEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setError(null);
    setBusy(true);
    const res = await createComment(itemId, trimmed);
    setBusy(false);

    if (res.error === "unauthenticated") {
      router.push(loginHref);
      return;
    }
    if (!res.success) {
      setError(res.error ?? "댓글 등록에 실패했어요");
      return;
    }
    setText("");
    router.refresh();
  }

  async function confirmDelete() {
    if (!confirmId) return;
    setError(null);
    setBusy(true);
    const res = await deleteComment(confirmId, itemId);
    setBusy(false);
    setConfirmId(null);

    if (!res.success) {
      setError(res.error ?? "삭제에 실패했어요");
      return;
    }
    router.refresh();
  }

  return (
    <section className="mt-8 border-t border-border pt-6 pb-24">
      <h2 className="text-sm font-medium text-foreground">
        댓글 {comments.length}
      </h2>

      {comments.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          첫 댓글을 남겨보세요
        </p>
      ) : (
        <ul className="mt-3 space-y-4">
          {comments.map((c) => {
            const mine = !!myId && c.user_id === myId;
            return (
              <li key={c.id} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">
                      {c.nickname ?? "회원"}
                    </span>
                    {c.user_id === ownerId && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-xs"
                        style={{
                          backgroundColor: "#E1F5EE",
                          color: "#0F6E56",
                        }}
                      >
                        작성자
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(c.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                    {c.content}
                  </p>
                </div>
                {mine && (
                  <button
                    type="button"
                    onClick={() => setConfirmId(c.id)}
                    disabled={busy}
                    className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                  >
                    삭제
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {myId ? (
        <form onSubmit={submit} className="mt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={COMMENT_MAX_LENGTH}
            rows={3}
            placeholder="댓글을 입력하세요"
            className="w-full resize-none rounded-base border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {text.length}/{COMMENT_MAX_LENGTH}
            </span>
            <button
              type="submit"
              disabled={busy || !text.trim()}
              className="shrink-0 rounded-base bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "등록 중..." : "등록"}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            전화번호 등 개인정보는 남기지 마세요. 연락은 전화·채팅 버튼을
            이용해주세요.
          </p>
        </form>
      ) : (
        <Link
          href={loginHref}
          className="mt-4 block w-full rounded-base border border-border bg-muted py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          로그인하고 댓글 남기기
        </Link>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {confirmId && (
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
                onClick={() => setConfirmId(null)}
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
    </section>
  );
}
