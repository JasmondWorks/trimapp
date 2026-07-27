
-- =========== profiles ===========
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== salons ===========
CREATE TABLE public.salons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  image_url TEXT,
  rating NUMERIC(2,1) DEFAULT 4.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.salons TO anon, authenticated;
GRANT ALL ON public.salons TO service_role;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salons are viewable by everyone" ON public.salons
  FOR SELECT TO anon, authenticated USING (true);

CREATE TRIGGER trg_salons_updated_at BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== services ===========
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'barber',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services are viewable by everyone" ON public.services
  FOR SELECT TO anon, authenticated USING (true);

CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== bookings ===========
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  stylist_name TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bookings" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own bookings" ON public.bookings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_salon_id ON public.bookings(salon_id);
CREATE INDEX idx_services_salon_id ON public.services(salon_id);

-- =========== seed salons + services ===========
WITH new_salons AS (
  INSERT INTO public.salons (name, description, address, city, phone, latitude, longitude, image_url, rating) VALUES
    ('Sovereign Cuts', 'Master barbers crafting sharp lines with old-school precision.', '245 Lafayette St', 'New York', '+1 212 555 0110', 40.7215, -73.9985, null, 4.9),
    ('Noir & Gold Studio', 'Luxury hairdressing salon with bespoke color and styling.', '78 Bond St', 'New York', '+1 212 555 0122', 40.7261, -73.9931, null, 4.8),
    ('The Ironworks Barber Co.', 'Industrial-inspired barbershop with hot towel shaves.', '390 Bowery', 'New York', '+1 212 555 0138', 40.7267, -73.9924, null, 4.7),
    ('Maison Lumière', 'Editorial hairstylists specialising in transformations and wigs.', '112 Greene St', 'New York', '+1 212 555 0164', 40.7248, -74.0007, null, 4.9),
    ('Blackwood Grooming', 'Full-service men''s grooming lounge with cognac bar.', '58 W 22nd St', 'New York', '+1 212 555 0177', 40.7418, -73.9910, null, 4.6),
    ('Velvet Room Hair', 'Signature blowouts and precision cuts by award-winning stylists.', '210 5th Ave', 'New York', '+1 212 555 0199', 40.7433, -73.9885, null, 4.8)
  RETURNING id, name
)
INSERT INTO public.services (salon_id, name, description, duration_minutes, price, category)
SELECT s.id, x.name, x.description, x.duration_minutes, x.price, x.category
FROM new_salons s
CROSS JOIN LATERAL (VALUES
  ('Signature Haircut', 'Precision cut tailored to your face shape.', 45, 55, 'barber'),
  ('Hot Towel Shave', 'Traditional straight-razor shave with hot towel.', 30, 40, 'barber'),
  ('Beard Sculpt', 'Detailed beard trim and line-up.', 20, 25, 'barber'),
  ('Colour & Style', 'Full colour service with blow-dry finish.', 120, 180, 'hairdresser'),
  ('Blowout & Style', 'Wash, blow-dry and styling.', 45, 65, 'hairdresser'),
  ('Wig Fitting & Styling', 'Custom wig consultation, fitting and style.', 90, 220, 'hairdresser')
) AS x(name, description, duration_minutes, price, category);
