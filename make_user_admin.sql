-- Grant Admin Permission to your user
-- Replace 'tu_email@ejemplo.com' with your actual login email address.

UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'tu_email@ejemplo.com'
);

-- Verify the change (optional)
-- SELECT * FROM public.profiles WHERE role = 'admin';
