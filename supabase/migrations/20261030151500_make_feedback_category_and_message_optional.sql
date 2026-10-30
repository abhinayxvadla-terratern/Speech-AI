-- Make feedback category and message optional, allowing multiselect & rating-only submissions
ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_category_check;
ALTER TABLE public.feedback ALTER COLUMN category DROP NOT NULL;
ALTER TABLE public.feedback ALTER COLUMN category SET DEFAULT 'General';
ALTER TABLE public.feedback ALTER COLUMN message DROP NOT NULL;
ALTER TABLE public.feedback ALTER COLUMN message SET DEFAULT '';
