/*
# Restore table-level grants for `authenticated`

Migration 015 dropped and recreated all 8 tables but never re-granted table
privileges. Postgres checks GRANTs before RLS, so all 22 policies from 015 are
unreachable — every query returns 42501 "permission denied for table".

Grants below mirror the existing policy set exactly (one grant per policy cmd),
so RLS remains the only thing deciding which *rows* a user sees.

`anon` is intentionally left out: there are currently no anon policies, so any
grant to it would be denied by RLS anyway. See the note at the bottom.
*/

GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_codes   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews    TO authenticated;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- read-only: rows are written by edge functions using the service role
GRANT SELECT ON public.packages      TO authenticated;
GRANT SELECT ON public.payments      TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;

-- service_role bypasses RLS but NOT grants. Edge functions use it to activate
-- subscriptions and record payments, and without this every admin write fails
-- with 42501 - silently, because supabase-js returns the error rather than throwing.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Keep future tables working without another patch like this one.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

/*
Still broken after this migration, tracked separately:
  - /pricing and /review/:id run as `anon` and need anon grants + policies
  - ContactPage inserts into support_tickets, dropped by 015, never recreated
  - ReviewFlow calls increment_qr_scan(), dropped by 015, never recreated
*/
