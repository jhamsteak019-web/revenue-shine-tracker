-- Create sales_entries table
CREATE TABLE public.sales_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  upc TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  qty INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  branch TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create extra_area_entries table
CREATE TABLE public.extra_area_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  branch TEXT NOT NULL,
  category TEXT NOT NULL,
  location_area TEXT NOT NULL,
  rental_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  no_fixtures TEXT,
  entry_date DATE NOT NULL,
  no_days INTEGER NOT NULL DEFAULT 0,
  sales_mhb NUMERIC(12,2) NOT NULL DEFAULT 0,
  sales_mlp NUMERIC(12,2) NOT NULL DEFAULT 0,
  sales_msh NUMERIC(12,2) NOT NULL DEFAULT 0,
  sales_mum NUMERIC(12,2) NOT NULL DEFAULT 0,
  photos_approved_boss TEXT[] DEFAULT '{}',
  photos_loi TEXT[] DEFAULT '{}',
  photos_msas TEXT[] DEFAULT '{}',
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.sales_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_area_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales_entries - users can only access their own data
CREATE POLICY "Users can view their own sales entries"
  ON public.sales_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales entries"
  ON public.sales_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales entries"
  ON public.sales_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales entries"
  ON public.sales_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for extra_area_entries - users can only access their own data
CREATE POLICY "Users can view their own extra area entries"
  ON public.extra_area_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extra area entries"
  ON public.extra_area_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extra area entries"
  ON public.extra_area_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own extra area entries"
  ON public.extra_area_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for common queries
CREATE INDEX idx_sales_entries_user_date ON public.sales_entries(user_id, date);
CREATE INDEX idx_sales_entries_branch ON public.sales_entries(branch);
CREATE INDEX idx_extra_area_user_date ON public.extra_area_entries(user_id, entry_date);

-- Create storage bucket for extra area photos
INSERT INTO storage.buckets (id, name, public) VALUES ('extra-area-photos', 'extra-area-photos', true);

-- Storage policies for extra area photos
CREATE POLICY "Users can view all extra area photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'extra-area-photos');

CREATE POLICY "Users can upload their own extra area photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'extra-area-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own extra area photos"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'extra-area-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own extra area photos"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'extra-area-photos' AND auth.uid()::text = (storage.foldername(name))[1]);