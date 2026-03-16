-- ============================================================
-- 004_fix_assignment_triggers.sql
-- Fix triggers to fire on INSERT as well as UPDATE
-- Previously only UPDATE was handled, so new client/onboarding
-- inserts with an editor pre-assigned did not send notifications.
-- ============================================================

-- ── clients table trigger ───────────────────────────────────
CREATE OR REPLACE FUNCTION notify_client_editor_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id UUID;
  v_editor     TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_editor := NEW.editor;
  ELSE
    -- UPDATE: skip if editor did not change
    IF NEW.editor IS NOT DISTINCT FROM OLD.editor THEN
      RETURN NEW;
    END IF;
    v_editor := NEW.editor;
  END IF;

  IF v_editor IS NULL OR v_editor = '' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_profile_id
    FROM profiles
   WHERE name = v_editor AND role = 'editor'
   LIMIT 1;

  IF v_profile_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, link, actor_name)
    VALUES (
      v_profile_id,
      'assignment',
      'You have been assigned to a production client',
      NEW.name,
      '/production',
      'Admin'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_client_editor_assigned ON clients;
CREATE TRIGGER tr_client_editor_assigned
  AFTER INSERT OR UPDATE OF editor ON clients
  FOR EACH ROW EXECUTE FUNCTION notify_client_editor_assigned();

-- ── onboarding table trigger ────────────────────────────────
CREATE OR REPLACE FUNCTION notify_onboarding_editor_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id UUID;
  v_editor     TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_editor := NEW.editor_assigned;
  ELSE
    IF NEW.editor_assigned IS NOT DISTINCT FROM OLD.editor_assigned THEN
      RETURN NEW;
    END IF;
    v_editor := NEW.editor_assigned;
  END IF;

  IF v_editor IS NULL OR v_editor = '' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_profile_id
    FROM profiles
   WHERE name = v_editor AND role = 'editor'
   LIMIT 1;

  IF v_profile_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, link, actor_name)
    VALUES (
      v_profile_id,
      'assignment',
      'You have been assigned a new client',
      NEW.client_name,
      '/onboarding',
      'Admin'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_onboarding_editor_assigned ON onboarding;
CREATE TRIGGER tr_onboarding_editor_assigned
  AFTER INSERT OR UPDATE OF editor_assigned ON onboarding
  FOR EACH ROW EXECUTE FUNCTION notify_onboarding_editor_assigned();
