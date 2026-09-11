-- 1. Keep vendors.rating and vendors.reviews_count in step with reviews.
--
-- Both columns existed and were rendered on /discover and the vendor page, but
-- nothing ever wrote to them: the only review trigger validated the 1-5 range.
-- Every vendor therefore showed a permanent rating of 0.
--
-- Recomputing from the table (rather than incrementing) keeps the columns
-- correct under deletes, rating edits, and rows inserted before this ran.
CREATE OR REPLACE FUNCTION public.refresh_vendor_rating(target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vendors v
  SET rating = COALESCE(agg.avg_rating, 0),
      reviews_count = COALESCE(agg.n, 0)
  FROM (
    SELECT round(avg(rating)::numeric, 1) AS avg_rating, count(*) AS n
    FROM public.reviews
    WHERE target_type = 'vendor' AND target_id = target
  ) agg
  WHERE v.id = target;
END; $$;

REVOKE EXECUTE ON FUNCTION public.refresh_vendor_rating(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_vendor_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On UPDATE the review may have been moved between targets, so refresh both.
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') AND OLD.target_type = 'vendor' THEN
    PERFORM public.refresh_vendor_rating(OLD.target_id);
  END IF;
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.target_type = 'vendor' THEN
    PERFORM public.refresh_vendor_rating(NEW.target_id);
  END IF;
  RETURN NULL; -- AFTER trigger: return value is ignored
END; $$;

REVOKE EXECUTE ON FUNCTION public.sync_vendor_rating() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reviews_sync_vendor_rating ON public.reviews;
CREATE TRIGGER reviews_sync_vendor_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.sync_vendor_rating();

-- Backfill anything written before the trigger existed.
UPDATE public.vendors v
SET rating = COALESCE(agg.avg_rating, 0),
    reviews_count = COALESCE(agg.n, 0)
FROM (
  SELECT target_id, round(avg(rating)::numeric, 1) AS avg_rating, count(*) AS n
  FROM public.reviews
  WHERE target_type = 'vendor'
  GROUP BY target_id
) agg
WHERE v.id = agg.target_id;

-- 2. One review per customer per vendor.
--
-- Without this a single account could post unlimited reviews and move a
-- vendor's average at will. The app upserts on this constraint so a repeat
-- review edits the existing one.
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_user_target
  ON public.reviews (user_id, target_type, target_id);

-- 3. Give admins a usable user list.
--
-- Promoting someone required a hand-written SQL insert, because nothing in the
-- app could list users: profiles was self-access only, and the email lives in
-- auth.users, which PostgREST does not expose.
--
-- Mirroring the email onto profiles keeps the whole flow under RLS. The
-- alternative — calling the auth admin API — would mean shipping the
-- service-role key to the server runtime, which bypasses RLS entirely for the
-- sake of one screen.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND p.email IS DISTINCT FROM u.email;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON public.profiles (lower(email));

-- Keep it in step for new signups. Replaces the original trigger function,
-- which copied only full_name and avatar_url.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Admins can read every profile. Ordinary users keep self-access only: this is
-- an additional policy, and RLS policies are OR-ed.
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
