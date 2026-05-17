-- 009_coaching_booking_lock.sql — mark private coaching sessions as booked after first successful Cal booking

alter table public.inquiries
  add column if not exists booked_at timestamptz,
  add column if not exists cal_booking_uid text,
  add column if not exists cal_booking_start_at timestamptz,
  add column if not exists cal_booking_end_at timestamptz;

alter table public.inquiries
  drop constraint if exists inquiries_status_check;

alter table public.inquiries
  add constraint inquiries_status_check
  check (status in ('new', 'contacted', 'converted', 'pending_payment', 'paid', 'booked', 'checkout_failed'));

create unique index if not exists inquiries_cal_booking_uid_unique_idx
  on public.inquiries (cal_booking_uid)
  where cal_booking_uid is not null;
