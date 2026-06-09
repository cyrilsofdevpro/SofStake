DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT pid FROM pg_stat_activity WHERE pid <> pg_backend_pid() AND datname = current_database() LOOP
    PERFORM pg_terminate_backend(r.pid);
  END LOOP;
END$$;
