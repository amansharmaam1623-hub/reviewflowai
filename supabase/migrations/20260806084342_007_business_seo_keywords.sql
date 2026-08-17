/*
# SEO Keywords for businesses
Store up to 5 SEO keywords used by the AI review generator.
*/
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS seo_keywords text[] DEFAULT '{}';
