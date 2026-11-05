-- Restrict client roles to the exact profile operations required by the app.
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
