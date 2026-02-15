DROP POLICY IF EXISTS "Enable update for admins" ON "public"."subscription_plans";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."subscription_plans";

-- Ensure RLS is on
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- 1. Simple READ policy (Public)
CREATE POLICY "Public Read Access" ON subscription_plans
FOR SELECT USING (true);

-- CRITICAL: Drop BOTH versions of the function to avoid conflicts/overloading
DROP FUNCTION IF EXISTS update_plan_details(uuid, text, numeric, text[], text, boolean, boolean);
DROP FUNCTION IF EXISTS update_plan_details(uuid, text, numeric, jsonb, text, boolean, boolean);

-- 2. Create a Secure Function (RPC) to update plans
-- This bypasses complex RLS for updates by handling logic inside a trusted function.
CREATE OR REPLACE FUNCTION update_plan_details(
  p_id uuid,
  p_name text,
  p_price numeric,
  p_features jsonb, -- Fixed: Changed from text[] to jsonb
  p_description text,
  p_is_active boolean,
  p_is_popular boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres), bypassing RLS
AS $$
DECLARE
  v_user_role text;
BEGIN
  -- 1. Check if the user calling this function is an Admin
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = auth.uid();

  IF v_user_role IS NULL OR v_user_role <> 'admin' THEN
    RAISE EXCEPTION 'Acceso Denegado: No tienes permisos de Administrador.';
  END IF;

  -- 2. Perform the Update
  UPDATE subscription_plans
  SET 
    name = p_name,
    price_monthly = p_price,
    features = p_features,
    description = p_description,
    is_active = p_is_active,
    is_popular = p_is_popular,
    updated_at = now()
  WHERE id = p_id;

  RETURN json_build_object('success', true);
END;
$$;
