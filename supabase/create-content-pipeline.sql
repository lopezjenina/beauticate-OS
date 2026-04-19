-- Create the content_pipeline table
CREATE TABLE IF NOT EXISTS public.content_pipeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'blog', 'edm', 'social'
    raw_draft TEXT,
    optimized_content TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'optimized', 'staged', 'pending_approval', 'approved', 'published'
    feedback TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.content_pipeline ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all content
CREATE POLICY "Enable read access for all authenticated users" ON public.content_pipeline
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert content
CREATE POLICY "Enable insert access for all authenticated users" ON public.content_pipeline
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update content
CREATE POLICY "Enable update access for all authenticated users" ON public.content_pipeline
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete content
CREATE POLICY "Enable delete access for all authenticated users" ON public.content_pipeline
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_pipeline_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_content_pipeline_updated_at ON public.content_pipeline;

CREATE TRIGGER update_content_pipeline_updated_at
    BEFORE UPDATE ON public.content_pipeline
    FOR EACH ROW
    EXECUTE FUNCTION update_content_pipeline_updated_at_column();
