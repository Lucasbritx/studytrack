-- ===========================================
-- STUDYTRACK - COMPLETE DATABASE SETUP
-- Run this in Supabase SQL Editor
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- ENUMS
-- ===========================================

CREATE TYPE topic_status AS ENUM ('not_started', 'studying', 'completed');
CREATE TYPE resource_type AS ENUM ('article', 'video', 'documentation', 'github', 'other');
CREATE TYPE member_role AS ENUM ('admin', 'member');

-- ===========================================
-- TABLES
-- ===========================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles(username);

-- Topics
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status topic_status DEFAULT 'not_started',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topics_user_id ON topics(user_id);
CREATE INDEX idx_topics_status ON topics(status);

-- Groups
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_invite_code ON groups(invite_code);

-- Group Members
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role member_role DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- Meetings
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    presenter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    meeting_date TIMESTAMPTZ NOT NULL,
    agenda TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_group_id ON meetings(group_id);
CREATE INDEX idx_meetings_date ON meetings(meeting_date);
CREATE INDEX idx_meetings_presenter ON meetings(presenter_id);

-- Resources (polymorphic: topic OR meeting)
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type resource_type DEFAULT 'article',
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT resource_has_parent CHECK (
        (topic_id IS NOT NULL AND meeting_id IS NULL) OR
        (topic_id IS NULL AND meeting_id IS NOT NULL)
    )
);

CREATE INDEX idx_resources_topic_id ON resources(topic_id);
CREATE INDEX idx_resources_meeting_id ON resources(meeting_id);

-- Study Sessions
CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    notes TEXT,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_topic_id ON study_sessions(topic_id);
CREATE INDEX idx_study_sessions_date ON study_sessions(session_date);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_meeting_id ON comments(meeting_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-add creator as group admin
CREATE OR REPLACE FUNCTION handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_group_created
    AFTER INSERT ON groups
    FOR EACH ROW EXECUTE FUNCTION handle_new_group();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- RLS HELPER FUNCTIONS
-- ===========================================

CREATE OR REPLACE FUNCTION is_group_member(group_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = group_uuid AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_group_admin(group_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = group_uuid AND user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_meeting_group(meeting_uuid UUID)
RETURNS UUID AS $$
DECLARE
    group_uuid UUID;
BEGIN
    SELECT group_id INTO group_uuid FROM meetings WHERE id = meeting_uuid;
    RETURN group_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dashboard stats function
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
    total_topics BIGINT,
    total_study_minutes BIGINT,
    group_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM topics WHERE user_id = auth.uid()),
        (SELECT COALESCE(SUM(duration_minutes), 0) FROM study_sessions WHERE user_id = auth.uid()),
        (SELECT COUNT(*) FROM group_members WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Topics
CREATE POLICY "Users can view own topics" ON topics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own topics" ON topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topics" ON topics FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own topics" ON topics FOR DELETE USING (auth.uid() = user_id);

-- Resources
CREATE POLICY "Users can view resources" ON resources FOR SELECT USING (
    (topic_id IS NOT NULL AND EXISTS (SELECT 1 FROM topics WHERE id = topic_id AND user_id = auth.uid()))
    OR (meeting_id IS NOT NULL AND is_group_member(get_meeting_group(meeting_id)))
);
CREATE POLICY "Users can create resources" ON resources FOR INSERT WITH CHECK (
    auth.uid() = created_by AND (
        (topic_id IS NOT NULL AND EXISTS (SELECT 1 FROM topics WHERE id = topic_id AND user_id = auth.uid()))
        OR (meeting_id IS NOT NULL AND is_group_member(get_meeting_group(meeting_id)))
    )
);
CREATE POLICY "Users can delete own resources" ON resources FOR DELETE USING (auth.uid() = created_by);

-- Study Sessions
CREATE POLICY "Users can view own sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create sessions" ON study_sessions FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (SELECT 1 FROM topics WHERE id = topic_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own sessions" ON study_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON study_sessions FOR DELETE USING (auth.uid() = user_id);

-- Groups
CREATE POLICY "View groups" ON groups FOR SELECT USING (is_public = true OR is_group_member(id));
CREATE POLICY "Create groups" ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Update groups" ON groups FOR UPDATE USING (is_group_admin(id)) WITH CHECK (is_group_admin(id));
CREATE POLICY "Delete groups" ON groups FOR DELETE USING (is_group_admin(id));

-- Group Members
CREATE POLICY "View members" ON group_members FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "Join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'member');
CREATE POLICY "Admin manage members" ON group_members FOR INSERT WITH CHECK (is_group_admin(group_id));
CREATE POLICY "Admin update roles" ON group_members FOR UPDATE USING (is_group_admin(group_id)) WITH CHECK (is_group_admin(group_id));
CREATE POLICY "Leave or remove" ON group_members FOR DELETE USING (auth.uid() = user_id OR is_group_admin(group_id));

-- Meetings
CREATE POLICY "View meetings" ON meetings FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "Create meetings" ON meetings FOR INSERT WITH CHECK (auth.uid() = created_by AND is_group_member(group_id));
CREATE POLICY "Update meetings" ON meetings FOR UPDATE USING (auth.uid() = created_by OR is_group_admin(group_id));
CREATE POLICY "Delete meetings" ON meetings FOR DELETE USING (auth.uid() = created_by OR is_group_admin(group_id));

-- Comments
CREATE POLICY "View comments" ON comments FOR SELECT USING (is_group_member(get_meeting_group(meeting_id)));
CREATE POLICY "Create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id AND is_group_member(get_meeting_group(meeting_id)));
CREATE POLICY "Update comments" ON comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete comments" ON comments FOR DELETE USING (auth.uid() = user_id OR is_group_admin(get_meeting_group(meeting_id)));
