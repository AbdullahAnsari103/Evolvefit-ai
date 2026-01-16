-- Production-Ready Database Schema with User Data Isolation
-- This migration sets up comprehensive user data isolation using Row Level Security (RLS)

-- ===== USER MANAGEMENT =====
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_auth_id ON public.users(auth_id);
CREATE INDEX idx_users_email ON public.users(email);

-- ===== USER PROFILES =====
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  goal TEXT,
  experience TEXT,
  height FLOAT,
  weight FLOAT,
  targets JSONB DEFAULT '{"calories": 2500, "protein": 150, "carbs": 300, "fats": 80}'::jsonb,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);

-- ===== COMMUNITY POSTS =====
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  caption TEXT,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);

-- ===== POST COMMENTS =====
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);

-- ===== POST LIKES =====
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_likes_post_id ON public.likes(post_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);

-- ===== CONTESTS =====
CREATE TABLE IF NOT EXISTS public.contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  prize_pool INTEGER DEFAULT 0,
  max_participants INTEGER,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contests_created_by ON public.contests(created_by);
CREATE INDEX idx_contests_dates ON public.contests(start_date, end_date);

-- ===== CONTEST SUBMISSIONS =====
CREATE TABLE IF NOT EXISTS public.contest_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  votes INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contest_id, user_id)
);

CREATE INDEX idx_submissions_contest_id ON public.contest_submissions(contest_id);
CREATE INDEX idx_submissions_user_id ON public.contest_submissions(user_id);
CREATE INDEX idx_submissions_verified ON public.contest_submissions(verified);

-- ===== USER CONTEST STATE =====
CREATE TABLE IF NOT EXISTS public.user_contest_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  accepted_contests UUID[] DEFAULT ARRAY[]::UUID[],
  total_points INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_contest_state_user_id ON public.user_contest_state(user_id);

-- ===== LEADERBOARD =====
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, contest_id)
);

CREATE INDEX idx_leaderboard_points ON public.leaderboard(points DESC);
CREATE INDEX idx_leaderboard_contest_id ON public.leaderboard(contest_id);
CREATE INDEX idx_leaderboard_user_id ON public.leaderboard(user_id);

-- ===== USER REWARDS =====
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rewards_user_id ON public.rewards(user_id);
CREATE INDEX idx_rewards_type ON public.rewards(reward_type);

-- ===== DAILY LOGS =====
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  calories INTEGER DEFAULT 0,
  protein INTEGER DEFAULT 0,
  carbs INTEGER DEFAULT 0,
  fats INTEGER DEFAULT 0,
  meals JSONB DEFAULT '[]'::jsonb,
  workouts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

CREATE INDEX idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX idx_daily_logs_date ON public.daily_logs(log_date DESC);

-- ===== ADMIN ACTIONS LOG =====
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  description TEXT,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created_at ON public.admin_actions(created_at DESC);

-- ===== ROW LEVEL SECURITY POLICIES =====

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_contest_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- User-specific read access
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- Posts policies - everyone can read, but only own posts can be modified
CREATE POLICY "Anyone can view posts"
  ON public.posts
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own posts"
  ON public.posts
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own posts"
  ON public.posts
  FOR DELETE
  USING (user_id = auth.uid());

-- Comments policies
CREATE POLICY "Anyone can view comments"
  ON public.comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.comments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON public.comments
  FOR UPDATE
  USING (user_id = auth.uid());

-- Likes policies
CREATE POLICY "Anyone can view likes"
  ON public.likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON public.likes
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own likes"
  ON public.likes
  FOR DELETE
  USING (user_id = auth.uid());

-- Contest submissions policies
CREATE POLICY "Users can view contest submissions"
  ON public.contest_submissions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can submit to contests"
  ON public.contest_submissions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Daily logs policies - strictly personal
CREATE POLICY "Users can only view own daily logs"
  ON public.daily_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can only create own daily logs"
  ON public.daily_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only update own daily logs"
  ON public.daily_logs
  FOR UPDATE
  USING (user_id = auth.uid());

-- User contest state - personal access
CREATE POLICY "Users can view own contest state"
  ON public.user_contest_state
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own contest state"
  ON public.user_contest_state
  FOR UPDATE
  USING (user_id = auth.uid());

-- Rewards - personal access
CREATE POLICY "Users can view own rewards"
  ON public.rewards
  FOR SELECT
  USING (user_id = auth.uid());

-- Admin actions - admins only
CREATE POLICY "Admins can view admin actions"
  ON public.admin_actions
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can create admin actions"
  ON public.admin_actions
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

COMMIT;
