-- ============================================================================
-- MMGM Enterprises — Phase 10: return-evidence storage
--
-- Spec §36 lets a customer attach photos to a return request (damaged/wrong
-- product evidence). Private bucket, not public — these can show personal
-- items/addresses in the background, unlike product photography which is
-- meant to be public. Access is enforced by path convention: every object
-- lives at "{auth.uid()}/...", and RLS checks that prefix against the
-- caller's own uid (or admin). Reads happen via short-lived signed URLs
-- generated server-side, never a public bucket URL.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('return-evidence', 'return-evidence', false)
on conflict (id) do nothing;

create policy "Users upload own return evidence" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'return-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users view own return evidence" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'return-evidence'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );
