import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 · 짜투(ZZATU)",
  description: "짜투(ZZATU) 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-screen-md px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        짜투(ZZATU) 이용약관
      </h1>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="font-semibold">제1조 (목적)</h2>
          <p className="mt-1 text-muted-foreground">
            이 약관은 [프로젝트 자구리](이하 &quot;회사&quot;)가 제공하는
            짜투(ZZATU) 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와
            회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">제2조 (정의)</h2>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>
              &quot;서비스&quot;란 회사가 제공하는, 제주 지역 건축자재의 중고
              거래(판매·나눔·구해요)를 회원 간에 연결·중개하는 모바일 웹
              플랫폼을 말합니다.
            </li>
            <li>
              &quot;회원&quot;이란 이 약관에 동의하고 카카오 계정으로 로그인하여
              서비스를 이용하는 자를 말합니다.
            </li>
            <li>
              &quot;게시물&quot;이란 회원이 등록한 자재 정보, 사진, 텍스트, 채팅
              메시지 등 일체의 콘텐츠를 말합니다.
            </li>
            <li>
              &quot;거래&quot;란 회원 간에 자재를 판매·구매·나눔하는 행위를
              말합니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-semibold">제3조 (약관의 게시와 개정)</h2>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>
              회사는 이 약관을 회원이 쉽게 확인할 수 있도록 서비스 화면에
              게시합니다.
            </li>
            <li>
              회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며,
              개정 시 적용일자와 사유를 명시하여 적용일 7일 전(회원에게 불리하거나
              중대한 변경은 30일 전)부터 공지합니다.
            </li>
            <li>
              회원이 개정약관에 동의하지 않는 경우 이용을 중단하고 탈퇴할 수
              있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-semibold">제4조 (회원가입 및 계정)</h2>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>
              회원가입은 카카오 계정 로그인으로 이루어지며, 이 약관 및
              개인정보처리방침에 동의함으로써 성립합니다.
            </li>
            <li>
              회원은 계정을 제3자가 이용하게 해서는 안 되며, 계정 관리 책임은
              회원에게 있습니다.
            </li>
            <li>회원은 닉네임 등 자신의 정보를 사실대로 등록하여야 합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-semibold">제5조 (서비스의 내용)</h2>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>
              회사는 회원이 자재를 판매·나눔·구매(구해요)할 수 있도록
              게시·검색·연락(채팅·전화) 기능을 제공합니다.
            </li>
            <li>
              회사는 거래를 중개·연결하는 플랫폼을 제공할 뿐이며, 거래의 당사자가
              아닙니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-semibold">제6조 (중개자의 지위 및 책임의 제한)</h2>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>
              서비스를 통한 거래는 회원 상호 간에 직접 이루어지며, 회사는 거래의
              당사자가 아닙니다.
            </li>
            <li>
              회사는 회원이 등록한 자재의 품질·상태·안전성·적법성, 표시·설명의
              정확성, 거래 의사와 능력 등을 보증하지 않으며 이에 대해 책임지지
              않습니다.
            </li>
            <li>
              회원 간 거래에서 발생한 분쟁(대금·하자·운반·환불 등)은 거래
              당사자인 회원들이 직접 해결하여야 하며, 회사는 이에 개입하거나
              책임지지 않습니다. 다만 회사는 분쟁 해결을 위한 합리적 노력(자료
              제공 등)을 할 수 있습니다.
            </li>
            <li>
              회사는 회원이 게시한 게시물 및 회원 간 주고받은 정보·연락처의
              활용에 대해 책임지지 않습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-semibold">제7조 (회원의 의무)</h2>
          <p className="mt-1 text-muted-foreground">
            회원은 다음 행위를 하여서는 안 됩니다.
          </p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>타인의 정보를 도용하거나 허위 정보를 등록하는 행위</li>
            <li>
              법령상 거래가 금지·제한된 물품, 도난품, 위조품 등을 등록·거래하는
              행위
            </li>
            <li>사기·기만 등 부당한 이득을 취하는 행위</li>
            <li>음란·폭력적·혐오 표현 등 부적절한 게시물을 등록하는 행위</li>
            <li>타인의 권리(저작권·초상권·개인정보 등)를 침해하는 행위</li>
            <li>광고·스팸 등 서비스 목적에 반하는 게시물을 등록하는 행위</li>
            <li>서비스의 정상적인 운영을 방해하는 행위</li>
          </ol>
        </section>

        <section>
          <h2 className="font-semibold">제8조 (게시물의 관리)</h2>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>게시물에 대한 책임은 등록한 회원에게 있습니다.</li>
            <li>
              회사는 게시물이 관련 법령 또는 이 약관을 위반하거나 타인의 권리를
              침해한다고 판단되는 경우, 사전 통지 없이 삭제하거나 게시를 제한할 수
              있습니다.
            </li>
            <li>회원은 부적절한 게시물·회원을 회사에 신고할 수 있습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-semibold">제9조 (이용의 제한)</h2>
          <p className="mt-1 text-muted-foreground">
            회사는 회원이 약관 또는 관련 법령을 위반하는 경우 사전 통지 후(긴급 시
            사후 통지) 서비스 이용을 제한·정지·해지할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">제10조 (계약 해지 및 탈퇴)</h2>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>
              회원은 언제든지 서비스 내 기능 또는 [010-5758-7121]를 통해 탈퇴를
              요청할 수 있습니다.
            </li>
            <li>탈퇴 시 개인정보는 개인정보처리방침에 따라 처리됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-semibold">제11조 (면책)</h2>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>
              회사는 천재지변·불가항력, 회원의 귀책, 제3자(카카오·호스팅·인프라
              제공자 등)의 장애 등 합리적 통제를 벗어난 사유로 인한 손해에
              책임지지 않습니다.
            </li>
            <li>
              무료로 제공되는 서비스 이용과 관련하여 관련 법령에 특별한 규정이
              없는 한 책임지지 않습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-semibold">제12조 (분쟁 해결 및 준거법)</h2>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>이 약관 및 서비스 이용에는 대한민국 법을 준거법으로 합니다.</li>
            <li>분쟁 발생 시 관할법원은 민사소송법에 따른 법원으로 합니다.</li>
          </ol>
        </section>

        <p className="pt-2 text-xs text-muted-foreground">
          부칙 — 이 약관은 2026.06.06부터 시행합니다.
        </p>
      </div>
    </main>
  );
}
