
ALTER TABLE public.profiles ALTER COLUMN is_active SET DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_seed_admin boolean := NEW.email IN ('tushar@esotericminerals.com', 'abey@esotericminerals.com');
BEGIN
  INSERT INTO public.profiles (id, email, full_name, employee_type, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'employee_type')::employee_type, 'offline'),
    is_seed_admin
  );

  IF is_seed_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee');
  END IF;

  RETURN NEW;
END;
$function$;
