"use client";

import { useRef, useState, type SyntheticEvent } from "react";

import { sendMessage } from "@/app/actions/chat";
import { uploadChatImage } from "@/lib/chat";

/**
 * 메시지 입력창 — 텍스트 + 사진. (Phase 5 · 5-B)
 *
 * 사진은 chat-images 에 `{userId}/{roomId}/파일명` 으로 업로드한 뒤 경로를 sendMessage 에
 * 넘긴다. 텍스트/사진 둘 중 하나만 있어도 전송 가능. 전송된 메시지는 Realtime 으로 스레드에
 * 나타난다.
 */
export function MessageInput({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickFile(selected: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    if (selected && selected.type.startsWith("image/")) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    } else {
      setFile(null);
      setPreview(null);
    }
  }

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: SyntheticEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !file) || busy) return;

    setError(null);
    setBusy(true);
    try {
      let imagePath: string | undefined;
      if (file) {
        imagePath = await uploadChatImage(file, userId, roomId);
      }
      const res = await sendMessage(roomId, trimmed, imagePath);
      if (!res.success) {
        setError(res.error ?? "전송에 실패했어요");
        return;
      }
      setText("");
      clearFile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "전송에 실패했어요");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="border-t border-border pt-2">
      {preview && (
        <div className="relative mb-2 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="h-20 w-20 rounded-base object-cover"
          />
          <button
            type="button"
            onClick={clearFile}
            aria-label="사진 제거"
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background text-foreground shadow-sm"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="사진 첨부"
          disabled={busy}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-base border border-border bg-muted text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="min-w-0 flex-1 rounded-base border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={busy || (!text.trim() && !file)}
          className="shrink-0 rounded-base bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "전송 중..." : "전송"}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </form>
  );
}
