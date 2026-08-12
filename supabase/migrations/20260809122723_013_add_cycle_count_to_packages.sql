ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS cycle_count_monthly integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS cycle_count_yearly integer NOT NULL DEFAULT 1;
