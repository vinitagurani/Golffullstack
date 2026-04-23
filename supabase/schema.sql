-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- PROFILES (extends Supabase Auth users)
-- ─────────────────────────────────────────
CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT NOT NULL,
  full_name           TEXT,
  role                TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber','admin')),
  subscription_status TEXT NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active','inactive','cancelled','past_due')),
  subscription_id     TEXT,          -- Stripe subscription ID
  plan                TEXT CHECK (plan IN ('monthly','yearly')),
  period_end          TIMESTAMPTZ,
  charity_id          UUID,
  charity_percentage  INT NOT NULL DEFAULT 10 CHECK (charity_percentage BETWEEN 10 AND 100),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ─────────────────────────────────────────
-- CHARITIES
-- ─────────────────────────────────────────
CREATE TABLE charities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  website     TEXT,
  featured    BOOLEAN NOT NULL DEFAULT FALSE,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK from profiles
ALTER TABLE profiles ADD CONSTRAINT fk_charity
  FOREIGN KEY (charity_id) REFERENCES charities(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────
-- SCORES
-- ─────────────────────────────────────────
CREATE TABLE scores (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score      INT NOT NULL CHECK (score BETWEEN 1 AND 45),
  score_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, score_date)          -- one score per date per user
);

-- Auto-enforce rolling 5-score limit
CREATE OR REPLACE FUNCTION enforce_score_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM scores
  WHERE id IN (
    SELECT id FROM scores
    WHERE user_id = NEW.user_id
    ORDER BY score_date DESC
    OFFSET 5
  );
  RETURN NULL;
END;
$$;
CREATE TRIGGER after_score_insert
  AFTER INSERT ON scores
  FOR EACH ROW EXECUTE PROCEDURE enforce_score_limit();

-- ─────────────────────────────────────────
-- DRAWS
-- ─────────────────────────────────────────
CREATE TABLE draws (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month        INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year         INT NOT NULL,
  draw_numbers INT[] NOT NULL,           -- 5 numbers drawn
  logic        TEXT NOT NULL DEFAULT 'random' CHECK (logic IN ('random','algorithmic')),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','simulated','published')),
  total_pool   NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  UNIQUE (month, year)
);

-- ─────────────────────────────────────────
-- WINNERS
-- ─────────────────────────────────────────
CREATE TABLE winners (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id      UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_type   INT NOT NULL CHECK (match_type IN (3,4,5)),
  prize_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','paid','rejected')),
  proof_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws     ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners   ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own row; admins see all
CREATE POLICY "Own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admin all profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Scores: users manage own scores
CREATE POLICY "Own scores" ON scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin all scores" ON scores FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Charities: public read; admin write
CREATE POLICY "Public charities read" ON charities FOR SELECT USING (TRUE);
CREATE POLICY "Admin charities write" ON charities FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Draws: public read published; admin all
CREATE POLICY "Public draws" ON draws FOR SELECT USING (status = 'published');
CREATE POLICY "Admin draws" ON draws FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Winners: own + admin
CREATE POLICY "Own winners" ON winners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin winners" ON winners FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ─────────────────────────────────────────
-- SEED: sample charities
-- ─────────────────────────────────────────
INSERT INTO charities (name, description, featured) VALUES
  ('Cancer Research UK',  'Funding life-saving cancer research worldwide.',        TRUE),
  ('British Heart Foundation', 'Fighting heart disease through research & education.', FALSE),
  ('Mind UK', 'Mental health charity providing advice and support.', FALSE);
