
REVOKE EXECUTE ON FUNCTION public.is_event_creator(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_event_creator(uuid, uuid) TO authenticated;
