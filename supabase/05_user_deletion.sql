-- ============================================================
-- GOSIMPLELIVING - MIGRATION 05: FULL USER DELETION
-- ============================================================
-- The standard anon/authenticated Supabase client cannot delete
-- from auth.users (only the service_role can).
--
-- This creates a SECURITY DEFINER function that runs with the
-- postgres role, allowing it to cascade-delete a user from
-- both auth.users and public.profiles in one call.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_user_by_id(target_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
    -- Only allow admins to call this function
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Permission denied: only admins can delete users.';
    END IF;

    -- Prevent admins from accidentally deleting themselves
    IF target_uid = auth.uid() THEN
        RAISE EXCEPTION 'Cannot delete your own account.';
    END IF;

    -- Delete from auth.users (cascades to profiles if FK is set,
    -- but we delete explicitly to be safe)
    DELETE FROM public.profiles WHERE id = target_uid;
    DELETE FROM auth.users WHERE id = target_uid;
END;
$$;

-- Grant execute permission to authenticated users
-- (the function itself will check the admin role internally)
GRANT EXECUTE ON FUNCTION public.delete_user_by_id(uuid) TO authenticated;

-- ============================================================
-- DONE!
-- ============================================================
NOTIFY pgrst, 'reload schema';
