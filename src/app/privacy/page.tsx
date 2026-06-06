import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 · 짜투(ZZATU)",
  description: "짜투(ZZATU) 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-screen-md px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        짜투(ZZATU) 개인정보처리방침
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        [프로젝트 자구리](이하 &quot;회사&quot;)는 「개인정보 보호법」 등 관련
        법령을 준수하며, 정보주체의 개인정보를 보호하기 위해 다음과 같이
        개인정보처리방침을 수립·공개합니다.
      </p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="font-semibold">1. 수집하는 개인정보 항목</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              카카오 로그인 시: 카카오 회원 식별자(고유번호), 닉네임, 프로필 정보
              등 회원이 동의한 항목
            </li>
            <li>
              서비스 이용 과정: 닉네임, 매물 등록 시 입력한 연락처(전화번호),
              게시물(자재 정보·사진), 채팅 메시지 및 사진
            </li>
            <li>
              자동 수집: 서비스 이용 기록, 접속 로그, 기기·브라우저 정보, 쿠키
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">2. 수집·이용 목적</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>회원 식별 및 로그인 등 서비스 제공</li>
            <li>
              자재 거래의 게시·검색·중개 및 회원 간 연락 기능 제공
            </li>
            <li>부정 이용 방지, 분쟁 처리, 신고 대응</li>
            <li>서비스 운영·개선 및 통계 분석</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">3. 보유 및 이용기간</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>원칙적으로 회원 탈퇴 시 지체 없이 파기합니다.</li>
            <li>관련 법령상 보존이 필요한 경우 해당 기간 동안 보관합니다.</li>
            <li>
              부정 이용 기록은 분쟁 대응을 위해 [1년] 동안 보관할 수 있습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">4. 개인정보의 제3자 제공</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              회사는 정보주체의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
            </li>
            <li>
              다만 회원이 매물에 연락처를 공개하거나 채팅으로 정보를 제공하는
              경우, 해당 정보는 거래 상대 회원에게 노출될 수 있으며 이는 회원의
              선택에 따릅니다.
            </li>
            <li>
              법령에 근거가 있거나 수사기관의 적법한 요청이 있는 경우 제공할 수
              있습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">5. 개인정보 처리의 위탁</h2>
          <p className="mt-1 text-muted-foreground">
            회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하며, 관련
            인프라는 국내 리전에서 운영됩니다.
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-left text-muted-foreground">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-medium text-foreground">
                    수탁자
                  </th>
                  <th className="py-2 font-medium text-foreground">위탁업무</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4">Supabase</td>
                  <td className="py-2">
                    데이터베이스·인증·저장소(이미지)·실시간 통신 등 인프라 운영
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pr-4">Vercel</td>
                  <td className="py-2">서비스 호스팅</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Kakao</td>
                  <td className="py-2">카카오 로그인 인증</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-semibold">
            6. 정보주체의 권리·의무 및 행사방법
          </h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              정보주체는 언제든지 개인정보 열람·정정·삭제·처리정지를 요구할 수
              있습니다.
            </li>
            <li>
              요청은 [010-5758-7121]로 하실 수 있으며, 회사는 지체 없이
              조치합니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">7. 개인정보의 파기</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              보유기간 경과 또는 처리 목적 달성 시 지체 없이 파기하며, 전자적
              파일은 복구 불가능한 방법으로 삭제합니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">8. 안전성 확보조치</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              접근권한 관리, 접근통제(행 수준 보안 등), 전송구간
              암호화(HTTPS), 비공개 저장소 운영 등 합리적 보호조치를 시행합니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">9. 쿠키 등의 운영</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              로그인 유지 등을 위해 쿠키를 사용할 수 있으며, 이용자는 브라우저
              설정으로 거부할 수 있습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">10. 개인정보 보호책임자</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>책임자: [고길] / 연락처: [010-5758-7121]</li>
            <li>개인정보 관련 문의·불만은 위 연락처로 하실 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">11. 권익침해 구제방법</h2>
          <p className="mt-1 text-muted-foreground">
            정보주체는 개인정보침해신고센터(국번없이 118),
            개인정보분쟁조정위원회(1833-6972) 등에 분쟁 해결·상담을 신청할 수
            있습니다.
          </p>
        </section>

        <p className="pt-2 text-xs text-muted-foreground">
          부칙 — 이 방침은 2026.06.06부터 시행합니다.
        </p>
      </div>
    </main>
  );
}
