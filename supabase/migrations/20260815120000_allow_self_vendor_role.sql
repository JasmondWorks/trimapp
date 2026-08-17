-- Let a user grant themselves the 'vendor' role when they apply.
--
-- Until now the only INSERT policy on user_roles was "Admins manage roles", so
-- the role insert in the become-a-vendor flow was silently denied: the vendor
-- row was created but the applicant could never reach /vendor. The original
-- client-side code did not check the error, which is why it looked like it
-- worked.
--
-- Scoped deliberately to 'vendor' only. Self-granting 'admin' stays impossible.
CREATE POLICY "Users can self-assign vendor role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'vendor');
