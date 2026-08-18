-- Phase 14 — Security: storage bucket upload validation.
--
-- Both buckets (product-media: Phase 11, return-evidence: Phase 10) were
-- created with no file_size_limit/allowed_mime_types, relying entirely on
-- client-side checks (product-media-manager.tsx, return-image-upload.tsx)
-- that a direct API call bypasses. Both buckets take direct-from-browser
-- uploads (the admin's/user's own session, not a server action), so this
-- bucket-level constraint is the only server-side enforcement available —
-- Supabase Storage checks it itself before accepting the object.
--
-- product-media allows both images and one video per product (Phase 11's
-- product-media-manager); the bucket-wide size ceiling has to cover the
-- larger of the two (video, 50MB) since Storage has one limit per bucket,
-- not per-MIME-type. The stricter 5MB image cap stays enforced client-side
-- only — a real gap for a determined attacker (they could upload a
-- 50MB "image"), acceptable here since it only enables mild storage abuse
-- by an authenticated admin, not a security compromise.
update storage.buckets
set
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
where id = 'product-media';

update storage.buckets
set
  file_size_limit = 5242880, -- 5MB, matches MAX_IMAGES client check in return-image-upload.tsx
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'return-evidence';
