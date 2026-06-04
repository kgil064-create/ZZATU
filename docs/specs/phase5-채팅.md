# Phase 5 · 채팅 설계서

> 코드 작성 전 합의서. 구매자가 자재에 대해 판매자에게 메시지를 보내고, 실시간으로 대화한다.
> ⚠️ 실측 반영: `chat_rooms`·`chat_messages` 테이블·컬럼·**RLS·`chat-images` Storage 정책·
>   `unique(item_id, buyer_id)`·`item_id` cascade 는 Phase 0 에 이미 존재.** 07 은 **Realtime
>   publication 활성화만** 하면 된다.

---

## 1. 목표

로그인한 사용자가 자재 상세에서 **판매자와 1:1 채팅**을 시작하고, **텍스트·사진을 실시간으로** 주고받는다. 전화하기는 그대로 두고 채팅하기를 추가한다.

- 한 자재 + 한 구매자 = 하나의 대화방 (중복 생성 방지 — `unique(item_id, buyer_id)` 기내장)
- 메시지는 **Supabase Realtime**으로 즉시 도착
- 사진은 `chat-images`(Private) 버킷 활용
- 방·메시지는 **참여자(구매자·판매자) 둘만** 접근 (RLS 기존재)

---

## 2. 사용자 시나리오

### A · 자재 문의 시작
1. 구매자가 자재 상세에서 "채팅하기"(남의 글에만 노출) 클릭
2. 비로그인이면 로그인으로 가드
3. 해당 자재+나 조합의 방이 없으면 생성, 있으면 기존 방으로 → `/chat/[roomId]`
4. 메시지 입력 → 전송 → 판매자 화면에 즉시 도착(Realtime)

### B · 대화 이어가기
1. 헤더 '채팅' 아이콘 → `/chat` 목록
2. 방마다 상대방 닉네임·자재 제목·마지막 메시지·시간 표시
3. 방 클릭 → 대화 이어서

### C · 사진 보내기
1. 채팅방 입력창에서 사진 첨부 → 전송
2. `chat-images`에 업로드 → 메시지에 사진 표시(상대에게도 즉시)

### D · 예외
- 참여자가 아닌 사람이 `/chat/[roomId]` 직접 접근 → 차단
- 본인 글에는 "채팅하기" 안 보임(자기랑 채팅 X)
- 비로그인 `/chat` 접근 → 로그인 가드

---

## 3. 만들 파일 목록

| 경로 | 종류 | 책임 |
|---|---|---|
| `supabase/migrations/07_chat_realtime.sql` | SQL | **`chat_messages`를 Realtime publication 에 추가** (RLS·컬럼·unique·cascade 는 Phase 0 기존재) |
| `src/app/items/[id]/_components/chat-button.tsx` | Client | 상세 "채팅하기"(구매자) → 방 생성/진입 |
| `src/app/chat/page.tsx` | Server | 채팅 목록 (내 방들) |
| `src/app/chat/[roomId]/page.tsx` | Server | 채팅방 (requireUser + 참여자 확인) |
| `src/app/chat/[roomId]/_components/message-thread.tsx` | Client | 메시지 목록 + Realtime 구독 |
| `src/app/chat/[roomId]/_components/message-input.tsx` | Client | 텍스트 + 사진 첨부 전송 |
| `src/app/actions/chat.ts` | Server Actions | `getOrCreateRoom(itemId)`, `sendMessage(roomId, content, image?)` |
| `src/lib/chat.ts` | 유틸 | 방의 상대방·자재 정보 헬퍼, 사진 signed URL |

> ⚠️ 07 은 RLS/컬럼/정책을 새로 만들지 않는다. Phase 0(01·02·04)에 모두 존재하므로 **publication 추가만**. (멱등하게 작성)

**수정할 파일:**
- `src/components/site-header.tsx` — 로그인 시 '채팅' 아이콘(→ `/chat`)
- `src/app/items/[id]/page.tsx` — 로그인 + 본인 글 아님일 때 `<ChatButton>`

---

## 4. 각 파일 책임 (핵심)

- **`getOrCreateRoom(itemId)`:** 서버 `getUser()`. 본인 글이면 거부. `(item_id, buyer_id=나)` 방 있으면 그 id 반환, 없으면 생성(`seller_id`=자재 주인). `unique(item_id, buyer_id)`로 중복 방지(경합 시 재조회).
- **`sendMessage(roomId, content, image?)`:** 서버 `getUser()` + 참여자 확인. 사진 있으면 `chat-images` 업로드 → message insert(content/image_url). `last_message_at` 갱신.
- **message-thread:** 초기 메시지 로드 + **Realtime 구독**(이 방의 새 message insert → 화면에 append, `filter: room_id=eq.{roomId}`). 내/상대 말풍선 좌우 구분.
- **message-input:** 텍스트 + 사진 첨부. 전송 시 낙관적 표시 후 `sendMessage`.
- **chat/page:** 내가 참여한 방들, `last_message_at desc`, 상대방·자재·마지막 메시지 미리보기.
- **chat-button:** "채팅하기" → `getOrCreateRoom` → `/chat/[roomId]` 이동. (전화하기와 나란히)

---

## 5. 라우팅

| 경로 | 설명 | 가드 |
|---|---|---|
| `/chat` | 채팅 목록 | requireUser |
| `/chat/[roomId]` | 채팅방 | requireUser + **참여자만**(아니면 차단) |

---

## 6. 디자인 토큰 활용

- 헤더 '채팅' 아이콘 — 말풍선, primary 톤, '마이' 옆
- 말풍선 — 내 메시지 primary(딥블루) 배경/우측, 상대 회색/좌측, 보통 크기 글자
- 채팅 목록 — 흰 카드, 상대 닉네임·자재 썸네일·마지막 메시지·시간
- "채팅하기" 버튼 — 전화하기와 시각적 짝(채팅=primary, 전화=보조 등)

---

## 7. 예외 / 보안 (가장 중요 — 대부분 Phase 0 기존재)

- **RLS — 기존재(02_setup_rls.sql):** `chat_rooms` select=참여자(`buyer_id`/`seller_id`=auth.uid()), insert=`buyer_id=auth.uid()`, update=참여자. `chat_messages` select=방 참여자, insert=`sender_id=auth.uid()`+참여 방, update=수신자. **Realtime 에도 RLS 적용되어 남의 방 메시지는 안 옴.**
- **방 접근:** 서버에서 참여자 확인 + RLS 이중.
- **`chat-images`(Private) 경로 규칙 — 중요:** 업로드 경로는 반드시 **`{user_id}/{room_id}/{파일명}` (3단)**. Storage 읽기 정책(`chat_images_select_participant`)이 경로의 **2번째 폴더 = room_id**로 참여자를 검증하기 때문. (Phase 2 item-images 의 `{user_id}/{파일명}` 2단 규칙과 다르니 주의.) 표시는 **signed URL**(`createSignedUrl`) — 참여자는 위 정책으로 생성 가능.
- **Realtime 활성화:** `chat_messages` 를 `supabase_realtime` publication 에 추가해야 구독 동작 → **07 의 유일한 작업**.
- **중복 방 방지:** `unique(item_id, buyer_id)` 기존재 — 추가 보강 불필요.

---

## 8. 완료 기준 (DoD)

**5-A (방 + 실시간 텍스트)**
- [ ] `chat_messages` Realtime publication 활성화(07)
- [ ] 상세 "채팅하기"(남의 글) → 방 생성/진입, 본인 글엔 안 보임
- [ ] 같은 글 다시 채팅 → 기존 방 재사용
- [ ] 텍스트 전송 → 상대 화면에 즉시 도착(Realtime)
- [ ] 참여자 아닌 사람 `/chat/[roomId]` 접근 → 차단

**5-B (목록 + 사진)**
- [ ] 헤더 '채팅' 아이콘 → `/chat`, 비로그인 가드
- [ ] 채팅 목록에 내 방들(상대·자재·마지막 메시지·시간)
- [ ] 사진 전송(`{user_id}/{room_id}/파일명` 경로) → 양쪽에 signed URL 로 표시
- [ ] 삭제된 자재의 방 처리 = cascade(자재 삭제 시 방·메시지 자동 삭제, 기내장)

---

## 9. 결정 사항 (5-A 진입 전 확정)

설계 미결정 4개를 기본안으로 확정(2026-06-04). chat 인프라가 Phase 0 에 잘 깔려 있어 추가 결정 부담 없음.

1. **자재 삭제 시 방 처리 = cascade** — `chat_rooms.item_id → items on delete cascade` 가 **이미 스키마에 존재.** 자재 삭제 시 방·메시지 자동 정리.
2. **안 읽음 표시(unread) = MVP 제외** — `buyer/seller_unread_count` 컬럼은 있으나 이번엔 미사용.
3. **채팅 목록 실시간 = 방 안에서만 Realtime** — 목록은 진입 시 로드. (목록 실시간 갱신은 추후)
4. **사진 표시 = signed URL** — Private 버킷, `createSignedUrl`.

---

## 10. 작업 분할

### 5-A · 방 + 실시간 텍스트 (커밋 세이브 포인트)
1. `07_chat_realtime.sql` — **`chat_messages` Realtime publication 추가만**(멱등) → Supabase 실행
2. `chat.ts`의 `getOrCreateRoom` + `sendMessage`(텍스트)
3. 상세 `<ChatButton>`(남의 글) — 방 생성/진입
4. `/chat/[roomId]` page + `message-thread`(Realtime) + `message-input`(텍스트)
5. 5-A 수동 테스트(브라우저 2개로 즉시 도착 확인) → **커밋**

### 5-B · 목록 + 사진
6. `/chat` 목록 + 헤더 '채팅' 아이콘
7. `message-input` 사진 첨부 + `sendMessage` 이미지 업로드(`chat-images`, **`{user_id}/{room_id}/파일명`**) + thread 사진 표시(signed URL)
8. 5-B 수동 테스트 → **커밋** → Phase 5 완료 일지
