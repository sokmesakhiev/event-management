
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'running',
  location text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  capacity integer,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published events are viewable by everyone"
  ON public.events FOR SELECT
  USING (is_published = true OR auth.uid() = creator_id);

CREATE POLICY "Users can create their own events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own events"
  ON public.events FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own events"
  ON public.events FOR DELETE TO authenticated
  USING (auth.uid() = creator_id);

-- security definer helper to check event ownership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_event_creator(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = _event_id AND creator_id = _user_id
  )
$$;

CREATE TABLE public.registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'registered',
  payment_status text NOT NULL DEFAULT 'unpaid',
  amount_paid_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;
GRANT ALL ON public.registrations TO service_role;

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own registrations"
  ON public.registrations FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_event_creator(event_id, auth.uid()));

CREATE POLICY "Users can register themselves"
  ON public.registrations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations"
  ON public.registrations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_event_creator(event_id, auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_event_creator(event_id, auth.uid()));

CREATE POLICY "Users and creators can delete registrations"
  ON public.registrations FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_event_creator(event_id, auth.uid()));

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
