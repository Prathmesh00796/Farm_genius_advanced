-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('farmer', 'dealer', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  village_city TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'farmer',
  UNIQUE(user_id, role)
);

-- Create crop_scans table for disease detection history
CREATE TABLE public.crop_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  disease_name TEXT,
  confidence DECIMAL(5,2),
  description TEXT,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create yield_predictions table
CREATE TABLE public.yield_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_type TEXT NOT NULL,
  soil_type TEXT NOT NULL,
  area_acres DECIMAL(10,2) NOT NULL,
  sowing_date DATE NOT NULL,
  irrigation_type TEXT NOT NULL,
  fertilizer_used TEXT NOT NULL,
  estimated_yield DECIMAL(10,2),
  harvest_days INTEGER,
  estimated_revenue DECIMAL(12,2),
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_prices table
CREATE TABLE public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop TEXT NOT NULL,
  variety TEXT NOT NULL,
  market TEXT NOT NULL,
  location TEXT NOT NULL,
  price_per_quintal DECIMAL(10,2) NOT NULL,
  trend_percentage DECIMAL(5,2),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nearby_markets table
CREATE TABLE public.nearby_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  opening_hours TEXT,
  available_crops TEXT[],
  rating DECIMAL(2,1),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8)
);

-- Create government_policies table
CREATE TABLE public.government_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  published_date DATE NOT NULL,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table for AI chatbot
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agricultural_tips table
CREATE TABLE public.agricultural_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  is_alert BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nearby_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agricultural_tips ENABLE ROW LEVEL SECURITY;

-- has_role function for checking user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Crop scans policies
CREATE POLICY "Users can view own scans" ON public.crop_scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans" ON public.crop_scans FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Yield predictions policies
CREATE POLICY "Users can view own predictions" ON public.yield_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own predictions" ON public.yield_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Market prices policies (public read)
CREATE POLICY "Anyone can view market prices" ON public.market_prices FOR SELECT USING (true);

-- Nearby markets policies (public read)
CREATE POLICY "Anyone can view nearby markets" ON public.nearby_markets FOR SELECT USING (true);

-- Government policies (public read)
CREATE POLICY "Anyone can view government policies" ON public.government_policies FOR SELECT USING (true);

-- Chat messages policies
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Agricultural tips policies (public read)
CREATE POLICY "Anyone can view tips" ON public.agricultural_tips FOR SELECT USING (true);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, village_city)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'phone', ''),
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'village_city', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data ->> 'role')::app_role, 'farmer')
  );
  
  RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for crop images
INSERT INTO storage.buckets (id, name, public) VALUES ('crop-images', 'crop-images', true);

-- Storage policies
CREATE POLICY "Users can upload crop images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'crop-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view crop images" ON storage.objects FOR SELECT USING (bucket_id = 'crop-images');
CREATE POLICY "Users can delete own crop images" ON storage.objects FOR DELETE USING (bucket_id = 'crop-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert sample market data
INSERT INTO public.market_prices (crop, variety, market, location, price_per_quintal, trend_percentage) VALUES
('Wheat', 'HD-2967', 'Khanna Mandi', 'Punjab', 2450, 2.5),
('Rice', 'Basmati-1121', 'Karnal Mandi', 'Haryana', 3850, -1.2),
('Maize', 'Pioneer-3396', 'Azadpur Mandi', 'Delhi', 1780, 0),
('Potato', 'Kufri Jyoti', 'Agra Mandi', 'Uttar Pradesh', 1250, 5.0),
('Cotton', 'J-34', 'Sirsa Mandi', 'Haryana', 6500, -0.8);

-- Insert sample nearby markets
INSERT INTO public.nearby_markets (name, address, phone, opening_hours, available_crops, rating, latitude, longitude) VALUES
('Khanna Grain Market', 'G.T. Road, Khanna, Punjab', '+91 1234567890', '6:00 AM - 8:00 PM', ARRAY['Wheat', 'Rice', 'Maize'], 4.5, 30.7046, 76.2117),
('Ludhiana APMC Market', 'Gill Road, Ludhiana, Punjab', '+91 9876543210', '5:00 AM - 7:00 PM', ARRAY['Wheat', 'Cotton', 'Vegetables'], 4.2, 30.8728, 75.8569),
('Jalandhar Wholesale Market', 'Nakodar Road, Jalandhar, Punjab', '+91 8765432109', '6:00 AM - 6:00 PM', ARRAY['Rice', 'Potato', 'Onion'], 4.0, 31.3260, 75.5762);

-- Insert sample government policies
INSERT INTO public.government_policies (title, description, category, published_date, link) VALUES
('PM-KISAN Scheme', 'Income support of ₹6,000 per year in three equal installments to all land holding farmer families.', 'Subsidy', '2025-04-10', 'https://pmkisan.gov.in'),
('Kisan Credit Card', 'Provides farmers with affordable credit for their agricultural operations and other needs.', 'Loan', '2025-03-15', 'https://www.kisancreditcard.in'),
('Pradhan Mantri Fasal Bima Yojana', 'Crop insurance scheme that provides coverage and financial support to farmers in case of crop failure.', 'Insurance', '2025-02-28', 'https://pmfby.gov.in'),
('Soil Health Card Scheme', 'Provides information on soil health and recommends appropriate dosage of nutrients for improving soil health and fertility.', 'Subsidy', '2025-01-20', 'https://soilhealth.dac.gov.in'),
('National Mission for Sustainable Agriculture', 'Promotes sustainable agriculture through climate change adaptation measures and resource conservation technologies.', 'Program', '2025-03-05', 'https://nmsa.dac.gov.in'),
('Agricultural Infrastructure Fund', 'Provides medium to long-term debt financing for investment in viable projects for post-harvest management infrastructure.', 'Loan', '2025-04-05', 'https://agriinfra.dac.gov.in');

-- Insert sample agricultural tips
INSERT INTO public.agricultural_tips (title, content, category, is_alert, published_at) VALUES
('New Subsidy for Organic Farming', 'Government announced new subsidies for organic farmers starting May 2025. Apply now to receive up to ₹50,000 per hectare for organic certification and inputs.', 'News', false, now()),
('Pest Alert: Aphid Outbreak', 'Aphid outbreaks reported in northern regions. Check your crops regularly and use neem-based organic pesticides for immediate control.', 'Alert', true, now()),
('Water Conservation Techniques', 'Learn new methods to conserve water during summer months. Drip irrigation can reduce water usage by up to 60% while improving crop yields.', 'Tips', false, now());