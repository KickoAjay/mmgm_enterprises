-- ============================================================================
-- Enquiries — a durable record of every /contact form submission.
--
-- Until now, a contact message only ever existed as an outbound email
-- (src/features/contact/actions.ts, sendEmail to COMPANY_EMAIL) — nothing
-- was ever stored. That's a real gap on its own (no way for an admin to
-- browse past enquiries), and a more urgent one right now specifically:
-- Resend's sandbox sender currently can't deliver to COMPANY_EMAIL at all
-- (confirmed by testing the live API — 403, domain not verified yet), so
-- every contact-form submission today is silently lost the moment the
-- email send fails. Saving the enquiry first, independent of whether the
-- email succeeds, means submissions survive that outage.
--
-- Inserted via the service-role client from the contact server action
-- (same pattern as guest checkout writing orders/addresses) — the
-- submitter is anonymous, so there's no anon-insert RLS policy here at
-- all, only admin-only read/update.
-- ============================================================================

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_enquiries_created_at on enquiries(created_at desc);

alter table enquiries enable row level security;

create policy "Admins view enquiries" on enquiries
  for select using (public.is_admin());
create policy "Admins update enquiries" on enquiries
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete enquiries" on enquiries
  for delete using (public.is_admin());
