"use client";

import { useEffect, useRef, useState } from "react";

export interface PhotoFile {
  id: string; // crypto.randomUUID() — React key + 순서 변경 추적용
  file: File; // 실제 File 객체 (Storage 업로드 시 사용)
  previewUrl: string; // URL.createObjectURL(file) — 미리보기용
}

interface PhotoUploaderProps {
  value: PhotoFile[];
  onChange: (next: PhotoFile[]) => void;
  maxPhotos?: number; // 기본 10
  required?: boolean; // type=request 일 땐 false, 그 외엔 true
  error?: string; // 외부에서 에러 메시지 주입 (옵션)
}

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * 사진 업로더. (Phase 2 · 5단계)
 *
 * 다중 선택 → 검증(이미지 MIME + 5MB 이하) → 미리보기 그리드 → 순서 변경/제거.
 * previewUrl 은 createObjectURL 로 만들므로 제거·unmount 시 revoke 로 누수를 막는다.
 */
export function PhotoUploader({
  value,
  onChange,
  maxPhotos = 10,
  required = true,
  error,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // 선택 시점 거부/잘림 사유. 다음 선택 시 사라진다.
  const [notices, setNotices] = useState<string[]>([]);

  // unmount 시 남아 있는 모든 objectURL 회수. value 가 계속 바뀌므로 ref 로 최신값 추적.
  const valueRef = useRef(value);
  valueRef.current = value;
  useEffect(() => {
    return () => {
      valueRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  function openPicker() {
    inputRef.current?.click();
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const picked = Array.from(fileList);
    const messages: string[] = [];
    const accepted: PhotoFile[] = [];

    for (const file of picked) {
      if (!file.type.startsWith("image/")) {
        messages.push(`${file.name} — 지원하지 않는 형식이에요`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        messages.push(`${file.name} — 파일이 너무 커요 (5MB 초과)`);
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    // maxPhotos 초과분은 자르고 안내. 잘린 항목의 objectURL 은 즉시 회수.
    const remaining = maxPhotos - value.length;
    let toAdd = accepted;
    if (accepted.length > remaining) {
      const overflow = accepted.slice(Math.max(remaining, 0));
      overflow.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      toAdd = accepted.slice(0, Math.max(remaining, 0));
      messages.push(
        `${maxPhotos}장까지만 추가됐어요. ${overflow.length}장이 잘렸어요`,
      );
    }

    setNotices(messages);
    if (toAdd.length > 0) onChange([...value, ...toAdd]);

    // 같은 파일을 다시 선택해도 onChange 가 트리거되도록 input 초기화.
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    const target = value[index];
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= value.length) return;
    const reordered = [...value];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    onChange(reordered);
  }

  const isEmpty = value.length === 0;
  const showError = Boolean(error) || (required && isEmpty);
  const canAddMore = value.length < maxPhotos;

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      multiple
      accept="image/*"
      className="hidden"
      onChange={(e) => handleFiles(e.target.files)}
    />
  );

  return (
    <div>
      {hiddenInput}

      {isEmpty ? (
        <button
          type="button"
          onClick={openPicker}
          className={
            "flex w-full flex-col items-center justify-center gap-2 rounded-base border-2 border-dashed p-6 text-center transition-colors " +
            (showError ? "border-destructive" : "border-border")
          }
        >
          <CameraIcon />
          <span className="text-sm font-medium text-foreground">
            사진을 선택하세요
          </span>
          <span className="text-xs text-muted-foreground">
            최대 {maxPhotos}장, 5MB 이하
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {value.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-base border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt=""
                className="h-full w-full rounded-base object-cover"
              />

              {index === 0 && (
                <span className="absolute left-1 top-1 rounded-md bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  대표
                </span>
              )}

              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label="사진 제거"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background text-foreground shadow-sm"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="absolute bottom-1 right-1 flex gap-1">
                <OrderButton
                  label="앞으로"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  dir="up"
                />
                <OrderButton
                  label="뒤로"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                  dir="down"
                />
              </div>
            </div>
          ))}

          {canAddMore && (
            <button
              type="button"
              onClick={openPicker}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-base border-2 border-dashed border-border text-muted-foreground transition-colors"
            >
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="text-xs">추가</span>
            </button>
          )}
        </div>
      )}

      {notices.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {notices.map((msg, i) => (
            <li key={i} className="text-sm text-destructive">
              {msg}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground"
      aria-hidden="true"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function OrderButton({
  label,
  disabled,
  onClick,
  dir,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  dir: "up" | "down";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={
        "flex h-6 w-6 items-center justify-center rounded-full bg-background text-foreground shadow-sm " +
        (disabled ? "cursor-not-allowed opacity-40" : "")
      }
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {dir === "up" ? (
          <polyline points="18 15 12 9 6 15" />
        ) : (
          <polyline points="6 9 12 15 18 9" />
        )}
      </svg>
    </button>
  );
}
