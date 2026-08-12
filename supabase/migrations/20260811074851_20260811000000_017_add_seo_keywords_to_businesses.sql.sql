-- Add seo_keywords column to businesses for the AI review generator.
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS seo_keywords jsonb NOT NULL DEFAULT '[]'::jsonb;
