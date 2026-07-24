"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { EllipsisVertical, ExternalLink, Share, Smartphone, X } from "lucide-react";

/**
 * "홈 화면에 추가" 안내 배너. (PWA · manifest 기반)
 *
 * 서비스워커를 두지 않기 때문에 안드로이드 크롬의 설치 프롬프트
 * (beforeinstallprompt)가 아예 안 올 수 있다. 그래서 [추가] 버튼은
 * 이벤트를 실제로 받아둔 경우에만 렌더하고, 못 받았으면 수동 안내 문구로
 * 대체한다 — 눌렀는데 아무 일도 안 일어나는 버튼은 만들지 않는다.
 *
 * 환경 3분기: 카카오톡 인앱(설치 불가 → 외부 브라우저 유도) / iOS 사파리
 * (공유 시트 수동 안내) / 그 외 모바일(프롬프트 또는 메뉴 안내).
 */

const DISMISS_KEY = "install-banner-dismissed";

/** 크롬 계열 전용 이벤트 — lib.dom 에 타입이 없어 직접 선언한다. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Mode = "kakao" | "ios" | "android";

export function InstallBanner() {
  // 환경 판정은 브라우저에서만 가능하다. 서버 스냅샷을 null 로 두면 SSR 결과와
  // 하이드레이션이 어긋나지 않고, 이펙트 안에서 setState 를 하지 않아도 된다.
  const detected = useSyncExternalStore(subscribeEnv, detectMode, () => null);
  const [hidden, setHidden] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // 브라우저 기본 미니 인포바 억제 — 우리 버튼으로 유도
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setHidden(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const mode = hidden ? null : detected;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // 사파리 프라이빗 모드 등에서 throw — 저장만 실패하고 닫기는 진행한다.
    }
    setHidden(true);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null); // 프롬프트는 1회용이다.
    if (outcome === "accepted") setHidden(true);
  }

  if (mode === null) return null;

  if (mode === "kakao") {
    return (
      <Shell
        tone="kakao"
        icon={<ExternalLink size={18} aria-hidden="true" />}
        title="브라우저에서 열면 더 편해요"
        onDismiss={dismiss}
      >
        <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-700">
          우측 위
          <EllipsisVertical size={14} aria-hidden="true" />
          → &ldquo;다른 브라우저로 열기&rdquo;
        </p>
      </Shell>
    );
  }

  if (mode === "ios") {
    return (
      <Shell
        tone="brand"
        icon={<Smartphone size={18} aria-hidden="true" />}
        title="짜투를 홈 화면에 추가"
        onDismiss={dismiss}
      >
        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#0F6E56]">
          아래 공유
          <Share size={14} aria-hidden="true" />
          아이콘 → &ldquo;홈 화면에 추가&rdquo;
        </p>
      </Shell>
    );
  }

  // 그 외 모바일(안드로이드 등)
  return (
    <Shell
      tone="brand"
      icon={<Smartphone size={18} aria-hidden="true" />}
      title="짜투를 홈 화면에 추가"
      onDismiss={dismiss}
      action={
        deferred ? (
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-lg bg-[#0E7C8C] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            추가
          </button>
        ) : undefined
      }
    >
      {deferred ? (
        <p className="mt-0.5 text-xs text-[#0F6E56]">
          한 번 추가해두면 앱처럼 바로 열려요.
        </p>
      ) : (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#0F6E56]">
          브라우저 메뉴
          <EllipsisVertical size={14} aria-hidden="true" />
          → &ldquo;앱 설치&rdquo;
        </p>
      )}
    </Shell>
  );
}

/** 배너 껍데기 — 톤(카톡/브랜드)만 다르고 구조는 같다. */
function Shell({
  tone,
  icon,
  title,
  children,
  action,
  onDismiss,
}: {
  tone: "kakao" | "brand";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  onDismiss: () => void;
}) {
  const kakao = tone === "kakao";

  return (
    <div
      className={
        "mb-3 flex items-start gap-2 rounded-lg p-3 " +
        (kakao ? "bg-amber-50 text-amber-800" : "bg-[#E1F5EE]")
      }
    >
      <span className={kakao ? "mt-0.5" : "mt-0.5 text-[#0F6E56]"}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p
          className={
            "text-sm font-medium " + (kakao ? "text-amber-800" : "text-[#04342C]")
          }
        >
          {title}
        </p>
        {children}
      </div>
      {action}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="배너 닫기"
        className={
          "-mr-1 -mt-1 shrink-0 rounded p-1 transition-opacity hover:opacity-70 " +
          (kakao ? "text-amber-700" : "text-[#0F6E56]")
        }
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * 판정 결과가 바뀔 수 있는 조건만 구독한다 — 홈 화면에서 열렸는지(display-mode),
 * 그리고 뷰포트가 데스크톱 폭이 됐는지. resize 를 직접 듣지 않는 건 불필요한
 * 리렌더를 피하기 위함이다.
 */
function subscribeEnv(onChange: () => void) {
  const queries = [
    window.matchMedia("(display-mode: standalone)"),
    window.matchMedia("(min-width: 1024px)"),
  ];
  for (const q of queries) q.addEventListener("change", onChange);
  return () => {
    for (const q of queries) q.removeEventListener("change", onChange);
  };
}

/**
 * 표시 여부 + 환경 판정. 브라우저에서만 호출된다(useSyncExternalStore 스냅샷).
 * null 이면 배너를 아예 렌더하지 않는다.
 */
function detectMode(): Mode | null {
  // 1) 이미 홈 화면에서 실행 중이면 안내할 이유가 없다.
  const iosStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (window.matchMedia("(display-mode: standalone)").matches || iosStandalone) {
    return null;
  }

  // 2) 사용자가 이미 닫았다.
  try {
    if (localStorage.getItem(DISMISS_KEY)) return null;
  } catch {
    // 스토리지 접근 불가 — 닫기 기록을 확인할 수 없으니 그냥 진행한다.
  }

  // 3) 데스크톱: 터치가 없거나 뷰포트가 넓으면 홈 화면 추가가 의미 없다.
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const wideViewport = window.matchMedia("(min-width: 1024px)").matches;
  if (!coarsePointer || wideViewport) return null;

  const ua = navigator.userAgent;

  // 카카오톡 인앱 브라우저는 홈 화면 추가 자체가 불가능하다.
  if (/KAKAOTALK/i.test(ua)) return "kakao";

  // iPadOS 13+ 는 UA 가 매킨토시로 나와서 터치 지원 여부로 함께 판정한다.
  const isIOS =
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";

  return "android";
}
