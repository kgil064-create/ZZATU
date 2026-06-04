"use client";

import { useEffect, useRef } from "react";

import { recordView } from "@/app/actions/views";

/**
 * 상세 진입 시 "최근 본 글" 기록. (Phase 4 · 4-B)
 *
 * 마운트 시 recordView(itemId)를 한 번만 호출한다(fire-and-forget, 에러 무시, UI 없음).
 * StrictMode 의 이중 마운트에 대비해 ref 가드를 둔다.
 */
export function RecordView({ itemId }: { itemId: string }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void recordView(itemId).catch(() => {});
  }, [itemId]);

  return null;
}
