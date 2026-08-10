-- Rode no Supabase → SQL Editor
-- user_id deve ser UUID (mesmo id do auth.users)

DROP TABLE IF EXISTS public.user_profiles CASCADE;

CREATE TABLE public.user_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  avatar_url   TEXT,
  is_kids      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles (user_id);

-- Limite de 5 perfis por usuário
CREATE OR REPLACE FUNCTION public.check_user_profiles_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.user_profiles
    WHERE user_id = NEW.user_id
  ) >= 5 THEN
    RAISE EXCEPTION 'Limite de 5 perfis atingido para este usuário';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_profiles_limit
BEFORE INSERT ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_user_profiles_limit();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- A API usa service role (bypass RLS). Policies abaixo são opcionais para acesso direto do client.
CREATE POLICY "profiles_select_own"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own"
  ON public.user_profiles FOR DELETE
  USING (auth.uid() = user_id);
