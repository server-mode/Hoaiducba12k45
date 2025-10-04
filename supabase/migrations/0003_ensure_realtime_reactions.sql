-- Ensure reactions (and other core tables) are part of realtime publication
-- Safe / idempotent: will create publication if missing and add tables if not already present.
-- Run this in Supabase SQL editor or via migration.

-- Create publication if not exists (Supabase usually has supabase_realtime already)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'CREATE PUBLICATION supabase_realtime FOR TABLE public.posts, public.comments, public.replies, public.reactions';
  END IF;
END $$;

-- Add missing tables individually (ignores already added)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT unnest(ARRAY['posts','comments','replies','reactions']) AS t LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', r.t);
    EXCEPTION WHEN duplicate_object THEN
      -- already in publication
      NULL;
    END;
  END LOOP;
END $$;
