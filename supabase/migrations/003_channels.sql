-- ============================================================
-- 003_channels.sql
-- Slack-like chat channels
-- ============================================================

CREATE TABLE channels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT NOT NULL DEFAULT '',
  allowed_roles TEXT[] NOT NULL DEFAULT ARRAY['admin','editor','social','viewer'],
  is_default    BOOLEAN NOT NULL DEFAULT false,
  position      INTEGER NOT NULL DEFAULT 0,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_channels_position ON channels(position);

-- ============================================================
-- Seed default channels
-- ============================================================
INSERT INTO channels (name, slug, description, allowed_roles, is_default, position) VALUES
  ('General',           'general',           'For the whole team',           ARRAY['admin','editor','social','viewer'], true,  0),
  ('Editors',           'editors',           'Editors and admins',           ARRAY['admin','editor'],                  false, 1),
  ('Videographers',     'videographers',     'Videography coordination',     ARRAY['admin'],                           false, 2),
  ('Social Management', 'social-management', 'Social media team',            ARRAY['admin','social'],                  false, 3),
  ('Client Discussion', 'client-discussion', 'Client notes & coordination',  ARRAY['admin','editor','social'],         false, 4),
  ('Admin Panel',       'admin-panel',       'Admin only',                   ARRAY['admin'],                           false, 5);

-- ============================================================
-- Add channel_id to messages + backfill existing messages to #general
-- ============================================================
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) ON DELETE CASCADE;

UPDATE messages
  SET channel_id = (SELECT id FROM channels WHERE slug = 'general')
  WHERE channel_id IS NULL;

ALTER TABLE messages
  ALTER COLUMN channel_id SET NOT NULL;

CREATE INDEX idx_messages_channel ON messages(channel_id, created_at DESC);

-- ============================================================
-- RLS for channels
-- ============================================================
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Users see channels where their role is in allowed_roles
CREATE POLICY "Users see allowed channels"
  ON channels FOR SELECT TO authenticated
  USING (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = ANY(allowed_roles)
  );

-- Only admins can insert/update/delete channels
CREATE POLICY "Admins manage channels"
  ON channels FOR ALL TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- Update messages RLS: gate on channel membership
-- (Drop old open policies and recreate with channel filter)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can read messages" ON messages;
DROP POLICY IF EXISTS "Authenticated can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
DROP POLICY IF EXISTS "Messages readable by authenticated" ON messages;

CREATE POLICY "Messages readable by channel member"
  ON messages FOR SELECT TO authenticated
  USING (
    channel_id IN (
      SELECT c.id FROM channels c
      WHERE (SELECT role::text FROM profiles WHERE id = auth.uid()) = ANY(c.allowed_roles)
    )
  );

CREATE POLICY "Channel members can insert messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    channel_id IN (
      SELECT c.id FROM channels c
      WHERE (SELECT role::text FROM profiles WHERE id = auth.uid()) = ANY(c.allowed_roles)
    )
  );

-- Enable realtime for channels
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
