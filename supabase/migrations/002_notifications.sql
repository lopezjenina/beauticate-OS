-- ============================================================
-- 002_notifications.sql
-- In-app notification system with assignment triggers
-- ============================================================

CREATE TYPE notification_type AS ENUM ('mention', 'assignment', 'system');

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL DEFAULT 'system',
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  link        TEXT NOT NULL DEFAULT '',
  is_read     BOOLEAN NOT NULL DEFAULT false,
  actor_id    UUID REFERENCES profiles(id),
  actor_name  TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user    ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated can insert notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- Trigger: notify editor when assigned on onboarding
-- ============================================================
CREATE OR REPLACE FUNCTION notify_onboarding_editor_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  IF NEW.editor_assigned IS DISTINCT FROM OLD.editor_assigned
     AND NEW.editor_assigned IS NOT NULL
     AND NEW.editor_assigned != '' THEN

    SELECT id INTO v_profile_id
    FROM profiles
    WHERE name = NEW.editor_assigned AND role = 'editor'
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
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_onboarding_editor_assigned
  AFTER UPDATE OF editor_assigned ON onboarding
  FOR EACH ROW EXECUTE FUNCTION notify_onboarding_editor_assigned();

-- ============================================================
-- Trigger: notify editor when assigned on production clients
-- ============================================================
CREATE OR REPLACE FUNCTION notify_client_editor_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  IF NEW.editor IS DISTINCT FROM OLD.editor
     AND NEW.editor IS NOT NULL
     AND NEW.editor != '' THEN

    SELECT id INTO v_profile_id
    FROM profiles
    WHERE name = NEW.editor AND role = 'editor'
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
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_client_editor_assigned
  AFTER UPDATE OF editor ON clients
  FOR EACH ROW EXECUTE FUNCTION notify_client_editor_assigned();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
