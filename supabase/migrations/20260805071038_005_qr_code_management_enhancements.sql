/*
# QR Code management enhancements

1. Add updated_at, download_count, last_scan columns to qr_codes.
2. Add a trigger to auto-update updated_at on row update.
3. Allow users to update their own qr_codes (already exists) — no policy change needed.
*/

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS download_count integer DEFAULT 0;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS last_scan timestamptz;

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION public.update_qr_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_qr_updated_at ON qr_codes;
CREATE TRIGGER trg_qr_updated_at
  BEFORE UPDATE ON qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_qr_updated_at();
