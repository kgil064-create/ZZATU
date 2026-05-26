-- =========================================================================
-- 짜투(ZZATU) 2차 MVP — Storage 버킷 보안 정책
-- 누가 파일을 업로드·읽기·삭제할 수 있는지 결정합니다.
-- 사전에 'item-images', 'chat-images' 버킷이 만들어져 있어야 합니다.
-- =========================================================================

-- 파일 경로 규칙 (앱 코드에서 이 규칙을 따라야 정책이 정상 동작합니다)
--   item-images:  {user_id}/{item_id}/{filename}
--   chat-images:  {user_id}/{room_id}/{filename}


-- =========================================================================
-- item-images — 자재 사진 (Public bucket)
-- =========================================================================

-- 로그인한 사용자만 업로드 가능 (본인 user_id 폴더에만)
create policy "item_images_upload_authenticated"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'item-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 본인이 올린 파일만 수정 가능
create policy "item_images_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'item-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 본인이 올린 파일만 삭제 가능
create policy "item_images_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'item-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 읽기는 Public bucket 설정으로 누구나 가능 (별도 정책 불필요)


-- =========================================================================
-- chat-images — 채팅 이미지 (Private bucket)
-- =========================================================================

-- 로그인한 사용자만 업로드 가능 (본인 user_id 폴더에만)
create policy "chat_images_upload_authenticated"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 채팅방 참여자(구매자 또는 판매자)만 읽기 가능
-- 경로의 두 번째 폴더가 room_id 라는 규칙을 활용
create policy "chat_images_select_participant"
on storage.objects for select
to authenticated
using (
  bucket_id = 'chat-images'
  and exists (
    select 1 from public.chat_rooms
    where chat_rooms.id::text = (storage.foldername(storage.objects.name))[2]
      and (chat_rooms.buyer_id = auth.uid() or chat_rooms.seller_id = auth.uid())
  )
);

-- 본인이 올린 파일만 삭제 가능
create policy "chat_images_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'chat-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);


-- =========================================================================
-- 끝. DB + Storage 셋업 완료.
-- =========================================================================
