"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/**
 * 가로 스와이프 사진 캐러셀. (Phase 3)
 *
 * scroll-snap 으로 한 장씩 넘기고 하단 점 인디케이터로 현재 위치를 표시한다.
 * 사진 1장이면 인디케이터를 숨기고, 0장이면 아무것도 렌더하지 않는다.
 */
export function PhotoGallery({ images }: { images: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  function handleScroll() {
    const el = ref.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div>
      <div
        ref={ref}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-base"
      >
        {images.map((url, i) => (
          <div
            key={i}
            className="relative aspect-square w-full shrink-0 snap-center bg-muted"
          >
            {/* 슬라이드 폭이 뷰포트에 따라 변하므로 fill + sizes.
                상세 본문은 max-w-screen-md(768px) + px-4 라 상한이 736px.
                첫 장은 이 화면의 LCP 요소 — 기본값(lazy)이면 LCP 가 늦어지므로
                eager 로 올린다. (Next 16 에서 priority 는 deprecated) */}
            <Image
              src={url}
              alt=""
              fill
              sizes="(max-width: 768px) calc(100vw - 2rem), 736px"
              loading={i === 0 ? "eager" : "lazy"}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={
                "h-1.5 w-1.5 rounded-full transition-colors " +
                (i === index ? "bg-primary" : "bg-border")
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
