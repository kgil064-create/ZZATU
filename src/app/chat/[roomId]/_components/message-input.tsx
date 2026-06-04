"use client";

import { useState, type SyntheticEvent } from "react";

import { sendMessage } from "@/app/actions/chat";

/**
 * 메시지 입력창. (Phase 5 · 5-A — 텍스트만, 사진은 5-B)
 *
 * 전송 성공 시 입력을 비운다(전송한 메시지는 Realtime 구독으로 스레드에 나타난다).
 */
export function MessageInput({ roomId }: { roomId: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: SyntheticEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setError(null);
    setBusy(true);
    const res = await sendMessage(roomId, trimmed);
    setBusy(false);
    if (!res.success) {
      setError(res.error ?? "전송에 실패했어요");
      return;
    }
    setText("");
  }

  return (
    <form onSubmit={submit} className="border-t border-border pt-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="min-w-0 flex-1 rounded-base border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="shrink-0 rounded-base bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          전송
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </form>
  );
}
