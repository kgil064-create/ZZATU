"use client";

import { useEffect, useRef } from "react";

import { recordView, incrementView } from "@/app/actions/views";

/**
 * 상세 진입 시 기록. (Phase 4 · 4-B / 그룹6 조회수 확장)
 *
 * 두 가지를 분리 처리한다(fire-and-forget, 에러 무시, UI 없음):
 *  1) 최근 본 글(item_views): recordView — 로그인 유저만(서버가 비로그인 no-op), 본인 글 포함.
 *  2) 총 조회수(view_count): incrementView — 비로그인 포함 전부. 단,
 *     - 본인 매물이면 올리지 않는다(isOwner).
 *     - sessionStorage 'viewed:<id>' 로 세션당 1회만(새로고침 반복 방지).
 * ref 가드로 React Strict Mode 이중 마운트를 막는다.
 */
export function RecordView({
  itemId,
  isOwner,
}: {
  itemId: string;
  isOwner: boolean;
}) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    // 1) 최근 본 글 — 로그인 유저만 서버에서 기록(비로그인은 서버 no-op).
    void recordView(itemId).catch(() => {});

    // 2) 조회수 — 본인 매물 제외 + 세션당 1회.
    if (isOwner) return;
    const key = `viewed:${itemId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage 접근 불가(사생활 모드 등)면 중복 판단 불가 → 카운트 생략.
      return;
    }
    void incrementView(itemId).catch(() => {});
  }, [itemId, isOwner]);

  return null;
}
