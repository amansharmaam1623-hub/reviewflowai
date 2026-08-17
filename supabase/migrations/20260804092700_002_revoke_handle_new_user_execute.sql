/*
# Revoke public execute on handle_new_user

The handle_new_user function is a trigger function that runs automatically
on auth.users INSERT. It should NOT be callable directly via RPC by anon
or authenticated users. Revoke EXECUTE from public and grant only to the
postgres role (which runs triggers).
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
