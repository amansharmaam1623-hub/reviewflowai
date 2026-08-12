/*
# Add target_url column to qr_codes

1. Modified Tables
- `qr_codes`: adds `target_url` (text) column to store the Google Review URL
  that the QR code encodes. When a customer scans the QR, they land on the
  ReviewFlow page which reads this URL and redirects to Google Reviews.
*/

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS target_url text DEFAULT '';
