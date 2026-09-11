-- Storage for user-supplied images.
--
-- Until now every image field (vendors.avatar_url, vendors.cover_url,
-- vendor_products.images, profiles.avatar_url) was a free-text URL box: a
-- vendor had to host the file somewhere else and paste a link. This adds the
-- bucket and the rules that let them upload instead.
--
-- Public read, because these are shop fronts and product shots that render for
-- anonymous visitors. Writes are restricted by path: the first folder segment
-- names the owning entity, and the policies below check the caller owns it.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 'media', true,
  5242880, -- 5MB; enough for a cover photo, small enough to bound abuse
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Layout:
--   profiles/<user_id>/<file>     a person's own avatar
--   vendors/<vendor_id>/<file>    shop avatar, cover, product shots
--
-- storage.foldername(name) splits the object path, so [1] is the entity kind
-- and [2] is the owning id.

DROP POLICY IF EXISTS "Media is publicly readable" ON storage.objects;
CREATE POLICY "Media is publicly readable" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Users write their own profile media" ON storage.objects;
CREATE POLICY "Users write their own profile media" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'profiles'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Vendor media is owned by whoever owns the vendor row, so a vendor can never
-- write into another shop's folder even though the bucket is shared.
DROP POLICY IF EXISTS "Vendors write their own media" ON storage.objects;
CREATE POLICY "Vendors write their own media" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'vendors'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM public.vendors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'vendors'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM public.vendors WHERE user_id = auth.uid()
    )
  );
