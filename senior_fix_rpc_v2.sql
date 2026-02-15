-- 1. Ensure RLS is enabled
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- 1.1 Fix Schema: Add updated_at column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'updated_at') THEN
        ALTER TABLE subscription_plans ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 2. Create a BRAND NEW Function (v2) to avoid any conflicts with the old one
-- We use a new name "update_plan_v2" to guarantee we are running this new code.

CREATE OR REPLACE FUNCTION update_plan_v2(
  p_id uuid,
  p_name text,
  p_price numeric,
  p_features jsonb, -- Explicitly JSONB
  p_description text,
  p_is_active boolean,
  p_is_popular boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role text;
BEGIN
  -- 1. Permission Check
  SELECT role INTO v_user_role FROM profiles WHERE id = auth.uid();
  
  IF v_user_role IS NULL OR v_user_role <> 'admin' THEN
    RAISE EXCEPTION 'Acceso Denegado: No tienes permisos de Administrador.';
  END IF;

  -- 2. Update
  UPDATE subscription_plans
  SET 
    name = p_name,
    price_monthly = p_price,
    features = p_features, -- Assign JSONB to JSONB
    description = p_description,
    is_active = p_is_active,
    is_popular = p_is_popular,
    updated_at = now()
  WHERE id = p_id;

  RETURN json_build_object('success', true);
END;
$$;
