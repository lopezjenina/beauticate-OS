-- Add new columns to content_pipeline for the enhanced workflow
-- Run this in Supabase SQL editor

ALTER TABLE public.content_pipeline 
  ADD COLUMN IF NOT EXISTS links TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT '';

-- Update status enum comment: 'draft' → For Optimization, 'optimized' → Optimized, 
-- 'review' → For Review, 'revision' → Needs Revision, 'approved' → Approved, 'scheduled' → Scheduled, 'published' → Published
