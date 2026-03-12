# StudyTrack - Architecture Document

A web platform for developers to track studies and collaborate in mentorship groups.

---

## Table of Contents

1. [Database Schema](#1-database-schema)
2. [Row Level Security (RLS)](#2-row-level-security-rls)
3. [Project Structure](#3-project-structure)
4. [API Patterns](#4-api-patterns)
5. [Key Pages](#5-key-pages)
6. [Implementation Plan](#6-implementation-plan)

---

## 1. Database Schema

### Entity Relationship Overview

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   profiles  │       │   topics    │       │  resources  │
│─────────────│       │─────────────│       │─────────────│
│ id (FK)     │──┐    │ id          │───────│ id          │
│ username    │  │    │ user_id(FK) │       │ topic_id    │
│ full_name   │  │    │ title       │       │ meeting_id  │
│ avatar_url  │  │    │ description │       │ title       │
│ created_at  │  │    │ status      │       │ url         │
└─────────────┘  │    │ notes       │       │ type        │
                 │    │ created_at  │       │ created_by  │
                 │    └─────────────┘       └─────────────┘
                 │
                 │    ┌─────────────────┐
                 │    │ study_sessions  │
                 │    │─────────────────│
                 ├────│ id              │
                 │    │ user_id (FK)    │
                 │    │ topic_id (FK)   │
                 │    │ duration_mins   │
                 │    │ notes           │
                 │    │ session_date    │
                 │    └─────────────────┘
                 │
                 │    ┌─────────────┐       ┌─────────────────┐
                 │    │   groups    │       │  group_members  │
                 │    │─────────────│       │─────────────────│
                 ├────│ id          │───────│ id              │
                 │    │ name        │       │ group_id (FK)   │
                 │    │ description │       │ user_id (FK)    │
                 │    │ created_by  │       │ role            │
                 │    │ created_at  │       │ joined_at       │
                 │    └─────────────┘       └─────────────────┘
                 │           │
                 │           │              ┌─────────────┐
                 │           │              │  meetings   │
                 │           │              │─────────────│
                 │           └──────────────│ id          │
                 │                          │ group_id    │
                 │                          │ title       │
                 │                          │ description │
                 │                          │ presenter_id│
                 │                          │ meeting_date│
                 │                          │ agenda      │
                 │                          └─────────────┘
                 │                                 │
                 │    ┌─────────────┐              │
                 │    │  comments   │              │
                 │    │─────────────│              │
                 └────│ id          │──────────────┘
                      │ meeting_id  │
                      │ user_id     │
                      │ content     │
                      │ created_at  │
                      └─────────────┘
```

### SQL Schema

```sql
-- ===========================================
-- STUDYTRACK DATABASE SCHEMA
-- Supabase/PostgreSQL
-- ===========================================

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- PROFILES TABLE
-- Extends Supabase auth.users
-- ===========================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- ===========================================
-- TOPICS TABLE
-- Personal study topics
-- ===========================================
CREATE TYPE topic_status AS ENUM ('not_started', 'studying', 'completed');

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

-- Index for user's topics
CREATE INDEX idx_topics_user_id ON topics(user_id);
CREATE INDEX idx_topics_status ON topics(status);

-- ===========================================
-- RESOURCES TABLE
-- Can be attached to topics OR meetings
-- ===========================================
CREATE TYPE resource_type AS ENUM ('article', 'video', 'documentation', 'github', 'other');

CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Polymorphic association: either topic_id OR meeting_id should be set
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    meeting_id UUID, -- Will add FK after meetings table is created
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type resource_type DEFAULT 'article',
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure resource is attached to exactly one parent
    CONSTRAINT resource_has_parent CHECK (
        (topic_id IS NOT NULL AND meeting_id IS NULL) OR
        (topic_id IS NULL AND meeting_id IS NOT NULL)
    )
);

CREATE INDEX idx_resources_topic_id ON resources(topic_id);
CREATE INDEX idx_resources_meeting_id ON resources(meeting_id);

-- ===========================================
-- STUDY SESSIONS TABLE
-- Log study time per topic
-- ===========================================
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

-- ===========================================
-- GROUPS TABLE
-- Mentorship/study groups
-- ===========================================
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

-- ===========================================
-- GROUP MEMBERS TABLE
-- Junction table for users <-> groups
-- ===========================================
CREATE TYPE member_role AS ENUM ('admin', 'member');

CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role member_role DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate memberships
    UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- ===========================================
-- MEETINGS TABLE
-- Group meetings/sessions
-- ===========================================
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

-- Add foreign key to resources table
ALTER TABLE resources 
ADD CONSTRAINT fk_resources_meeting 
FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE;

-- ===========================================
-- COMMENTS TABLE
-- Comments on meetings
-- ===========================================
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
-- HELPER FUNCTIONS
-- ===========================================

-- Function to automatically create profile on signup
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

-- Trigger to create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to auto-add creator as admin when group is created
CREATE OR REPLACE FUNCTION handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add creator as admin
CREATE TRIGGER on_group_created
    AFTER INSERT ON groups
    FOR EACH ROW EXECUTE FUNCTION handle_new_group();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_topics_updated_at
    BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 2. Row Level Security (RLS)

```sql
-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- HELPER FUNCTIONS FOR RLS
-- ===========================================

-- Check if user is member of a group
CREATE OR REPLACE FUNCTION is_group_member(group_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = group_uuid
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin of a group
CREATE OR REPLACE FUNCTION is_group_admin(group_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = group_uuid
        AND user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get group_id from meeting
CREATE OR REPLACE FUNCTION get_meeting_group(meeting_uuid UUID)
RETURNS UUID AS $$
DECLARE
    group_uuid UUID;
BEGIN
    SELECT group_id INTO group_uuid
    FROM meetings
    WHERE id = meeting_uuid;
    RETURN group_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PROFILES POLICIES
-- ===========================================

-- Anyone can view profiles (for displaying names in groups)
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ===========================================
-- TOPICS POLICIES
-- ===========================================

-- Users can view only their own topics
CREATE POLICY "Users can view own topics"
    ON topics FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create topics for themselves
CREATE POLICY "Users can create own topics"
    ON topics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own topics
CREATE POLICY "Users can update own topics"
    ON topics FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own topics
CREATE POLICY "Users can delete own topics"
    ON topics FOR DELETE
    USING (auth.uid() = user_id);

-- ===========================================
-- RESOURCES POLICIES
-- ===========================================

-- Users can view resources on their topics
CREATE POLICY "Users can view own topic resources"
    ON resources FOR SELECT
    USING (
        -- Own topic resources
        (topic_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM topics WHERE id = topic_id AND user_id = auth.uid()
        ))
        OR
        -- Meeting resources (if member of group)
        (meeting_id IS NOT NULL AND is_group_member(get_meeting_group(meeting_id)))
    );

-- Users can create resources on their topics or group meetings
CREATE POLICY "Users can create resources"
    ON resources FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND (
            -- On own topic
            (topic_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM topics WHERE id = topic_id AND user_id = auth.uid()
            ))
            OR
            -- On meeting (if member)
            (meeting_id IS NOT NULL AND is_group_member(get_meeting_group(meeting_id)))
        )
    );

-- Users can delete their own resources
CREATE POLICY "Users can delete own resources"
    ON resources FOR DELETE
    USING (auth.uid() = created_by);

-- ===========================================
-- STUDY SESSIONS POLICIES
-- ===========================================

-- Users can view only their own study sessions
CREATE POLICY "Users can view own study sessions"
    ON study_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create study sessions for their own topics
CREATE POLICY "Users can create study sessions"
    ON study_sessions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM topics WHERE id = topic_id AND user_id = auth.uid()
        )
    );

-- Users can update their own study sessions
CREATE POLICY "Users can update own study sessions"
    ON study_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own study sessions
CREATE POLICY "Users can delete own study sessions"
    ON study_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- ===========================================
-- GROUPS POLICIES
-- ===========================================

-- Members can view groups they belong to, anyone can view public groups
CREATE POLICY "Members can view their groups"
    ON groups FOR SELECT
    USING (
        is_public = true
        OR is_group_member(id)
    );

-- Any authenticated user can create a group
CREATE POLICY "Authenticated users can create groups"
    ON groups FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Only group admins can update group
CREATE POLICY "Admins can update group"
    ON groups FOR UPDATE
    USING (is_group_admin(id))
    WITH CHECK (is_group_admin(id));

-- Only group admins can delete group
CREATE POLICY "Admins can delete group"
    ON groups FOR DELETE
    USING (is_group_admin(id));

-- ===========================================
-- GROUP MEMBERS POLICIES
-- ===========================================

-- Group members can view other members
CREATE POLICY "Members can view group members"
    ON group_members FOR SELECT
    USING (is_group_member(group_id));

-- Users can join groups (insert themselves)
CREATE POLICY "Users can join groups"
    ON group_members FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND role = 'member' -- Can only join as member, not admin
    );

-- Admins can add/manage members
CREATE POLICY "Admins can manage members"
    ON group_members FOR INSERT
    WITH CHECK (is_group_admin(group_id));

-- Admins can update member roles
CREATE POLICY "Admins can update member roles"
    ON group_members FOR UPDATE
    USING (is_group_admin(group_id))
    WITH CHECK (is_group_admin(group_id));

-- Users can leave groups (delete themselves) or admins can remove members
CREATE POLICY "Users can leave or admins can remove"
    ON group_members FOR DELETE
    USING (
        auth.uid() = user_id
        OR is_group_admin(group_id)
    );

-- ===========================================
-- MEETINGS POLICIES
-- ===========================================

-- Group members can view meetings
CREATE POLICY "Members can view meetings"
    ON meetings FOR SELECT
    USING (is_group_member(group_id));

-- Group members can create meetings
CREATE POLICY "Members can create meetings"
    ON meetings FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND is_group_member(group_id)
    );

-- Meeting creator or group admin can update meetings
CREATE POLICY "Creator or admin can update meetings"
    ON meetings FOR UPDATE
    USING (
        auth.uid() = created_by
        OR is_group_admin(group_id)
    )
    WITH CHECK (
        auth.uid() = created_by
        OR is_group_admin(group_id)
    );

-- Meeting creator or group admin can delete meetings
CREATE POLICY "Creator or admin can delete meetings"
    ON meetings FOR DELETE
    USING (
        auth.uid() = created_by
        OR is_group_admin(group_id)
    );

-- ===========================================
-- COMMENTS POLICIES
-- ===========================================

-- Group members can view comments on meetings
CREATE POLICY "Members can view meeting comments"
    ON comments FOR SELECT
    USING (is_group_member(get_meeting_group(meeting_id)));

-- Group members can create comments
CREATE POLICY "Members can create comments"
    ON comments FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND is_group_member(get_meeting_group(meeting_id))
    );

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
    ON comments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments, admins can delete any
CREATE POLICY "Users or admins can delete comments"
    ON comments FOR DELETE
    USING (
        auth.uid() = user_id
        OR is_group_admin(get_meeting_group(meeting_id))
    );
```

---

## 3. Project Structure

```
studytrack/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group (no layout)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Minimal auth layout
│   │   │
│   │   ├── (dashboard)/              # Main app route group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Main dashboard
│   │   │   ├── topics/
│   │   │   │   ├── page.tsx          # Topics list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create topic
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Topic details
│   │   │   ├── sessions/
│   │   │   │   ├── page.tsx          # Study sessions list
│   │   │   │   └── new/
│   │   │   │       └── page.tsx      # Log new session
│   │   │   ├── groups/
│   │   │   │   ├── page.tsx          # Groups list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create group
│   │   │   │   ├── join/
│   │   │   │   │   └── page.tsx      # Join via invite code
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Group overview
│   │   │   │       ├── members/
│   │   │   │       │   └── page.tsx  # Manage members
│   │   │   │       ├── meetings/
│   │   │   │       │   ├── new/
│   │   │   │       │   │   └── page.tsx
│   │   │   │       │   └── [meetingId]/
│   │   │   │       │       └── page.tsx
│   │   │   │       └── settings/
│   │   │   │           └── page.tsx  # Group settings (admin)
│   │   │   ├── profile/
│   │   │   │   └── page.tsx          # User profile/settings
│   │   │   └── layout.tsx            # Dashboard layout with sidebar
│   │   │
│   │   ├── api/                      # API routes (if needed)
│   │   │   └── auth/
│   │   │       └── callback/
│   │   │           └── route.ts      # OAuth callback
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   ├── loading.tsx               # Global loading
│   │   ├── error.tsx                 # Global error
│   │   └── not-found.tsx             # 404 page
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                   # Layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── nav-links.tsx
│   │   │   └── user-menu.tsx
│   │   │
│   │   ├── auth/                     # Auth components
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   └── auth-provider.tsx
│   │   │
│   │   ├── topics/                   # Topic components
│   │   │   ├── topic-card.tsx
│   │   │   ├── topic-form.tsx
│   │   │   ├── topic-list.tsx
│   │   │   └── status-badge.tsx
│   │   │
│   │   ├── resources/                # Resource components
│   │   │   ├── resource-card.tsx
│   │   │   ├── resource-form.tsx
│   │   │   ├── resource-list.tsx
│   │   │   └── resource-type-icon.tsx
│   │   │
│   │   ├── sessions/                 # Study session components
│   │   │   ├── session-card.tsx
│   │   │   ├── session-form.tsx
│   │   │   ├── session-list.tsx
│   │   │   └── duration-display.tsx
│   │   │
│   │   ├── groups/                   # Group components
│   │   │   ├── group-card.tsx
│   │   │   ├── group-form.tsx
│   │   │   ├── group-list.tsx
│   │   │   ├── member-list.tsx
│   │   │   ├── member-card.tsx
│   │   │   ├── invite-dialog.tsx
│   │   │   └── role-badge.tsx
│   │   │
│   │   ├── meetings/                 # Meeting components
│   │   │   ├── meeting-card.tsx
│   │   │   ├── meeting-form.tsx
│   │   │   ├── meeting-list.tsx
│   │   │   ├── agenda-display.tsx
│   │   │   └── comment-section.tsx
│   │   │
│   │   ├── dashboard/                # Dashboard components
│   │   │   ├── stats-card.tsx
│   │   │   ├── recent-sessions.tsx
│   │   │   ├── active-topics.tsx
│   │   │   └── upcoming-meetings.tsx
│   │   │
│   │   └── shared/                   # Shared/common components
│   │       ├── empty-state.tsx
│   │       ├── loading-spinner.tsx
│   │       ├── confirm-dialog.tsx
│   │       ├── page-header.tsx
│   │       └── error-message.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client
│   │   │   ├── middleware.ts         # Auth middleware helper
│   │   │   └── admin.ts              # Admin client (if needed)
│   │   │
│   │   ├── actions/                  # Server Actions
│   │   │   ├── auth.ts               # Auth actions
│   │   │   ├── topics.ts             # Topic CRUD
│   │   │   ├── resources.ts          # Resource CRUD
│   │   │   ├── sessions.ts           # Study session CRUD
│   │   │   ├── groups.ts             # Group CRUD
│   │   │   ├── members.ts            # Group membership
│   │   │   ├── meetings.ts           # Meeting CRUD
│   │   │   └── comments.ts           # Comment CRUD
│   │   │
│   │   ├── queries/                  # Data fetching functions
│   │   │   ├── topics.ts
│   │   │   ├── resources.ts
│   │   │   ├── sessions.ts
│   │   │   ├── groups.ts
│   │   │   ├── meetings.ts
│   │   │   └── dashboard.ts
│   │   │
│   │   ├── validations/              # Zod schemas
│   │   │   ├── auth.ts
│   │   │   ├── topics.ts
│   │   │   ├── resources.ts
│   │   │   ├── sessions.ts
│   │   │   ├── groups.ts
│   │   │   └── meetings.ts
│   │   │
│   │   └── utils/
│   │       ├── dates.ts              # Date formatting
│   │       ├── duration.ts           # Duration helpers
│   │       └── cn.ts                 # className helper
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-realtime.ts           # Supabase realtime
│   │   └── use-toast.ts
│   │
│   └── types/
│       ├── database.ts               # Supabase generated types
│       ├── api.ts                    # API response types
│       └── index.ts                  # Shared types
│
├── public/
│   ├── logo.svg
│   └── ...
│
├── supabase/
│   ├── migrations/                   # Database migrations
│   │   └── 001_initial_schema.sql
│   ├── seed.sql                      # Seed data for development
│   └── config.toml                   # Supabase local config
│
├── .env.local                        # Environment variables
├── .env.example                      # Example env file
├── middleware.ts                     # Next.js middleware (auth)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 4. API Patterns

### Supabase Client Setup

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  )
}
```

### Server Actions Pattern

```typescript
// src/lib/actions/topics.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { topicSchema, type TopicInput } from '@/lib/validations/topics'

export type ActionState = {
  error?: string
  success?: boolean
}

// CREATE
export async function createTopic(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Validate input
  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status') || 'not_started',
    notes: formData.get('notes'),
  }

  const validated = topicSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  // Insert into database
  const { error } = await supabase
    .from('topics')
    .insert({
      ...validated.data,
      user_id: user.id,
    })

  if (error) {
    return { error: 'Failed to create topic' }
  }

  revalidatePath('/topics')
  redirect('/topics')
}

// READ (single)
export async function getTopic(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('topics')
    .select(`
      *,
      resources (*),
      study_sessions (*)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error('Topic not found')
  return data
}

// UPDATE
export async function updateTopic(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const validated = topicSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status'),
    notes: formData.get('notes'),
  })

  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const { error } = await supabase
    .from('topics')
    .update(validated.data)
    .eq('id', id)

  if (error) {
    return { error: 'Failed to update topic' }
  }

  revalidatePath(`/topics/${id}`)
  revalidatePath('/topics')
  return { success: true }
}

// DELETE
export async function deleteTopic(id: string): Promise<ActionState> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: 'Failed to delete topic' }
  }

  revalidatePath('/topics')
  redirect('/topics')
}

// UPDATE STATUS (quick action)
export async function updateTopicStatus(
  id: string, 
  status: 'not_started' | 'studying' | 'completed'
): Promise<ActionState> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('topics')
    .update({ status })
    .eq('id', id)

  if (error) {
    return { error: 'Failed to update status' }
  }

  revalidatePath('/topics')
  revalidatePath(`/topics/${id}`)
  revalidatePath('/dashboard')
  return { success: true }
}
```

### Query Functions Pattern

```typescript
// src/lib/queries/topics.ts
import { createClient } from '@/lib/supabase/server'

export async function getTopics() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getTopicsWithStats() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('topics')
    .select(`
      *,
      resources (count),
      study_sessions (
        duration_minutes
      )
    `)
    .order('updated_at', { ascending: false })

  if (error) throw error
  
  // Transform to add total study time
  return data.map(topic => ({
    ...topic,
    totalStudyMinutes: topic.study_sessions?.reduce(
      (sum, s) => sum + s.duration_minutes, 0
    ) || 0,
    resourceCount: topic.resources?.[0]?.count || 0,
  }))
}
```

### Dashboard Queries

```typescript
// src/lib/queries/dashboard.ts
import { createClient } from '@/lib/supabase/server'

export async function getDashboardData() {
  const supabase = await createClient()
  
  // Run queries in parallel
  const [
    topicsResult,
    sessionsResult,
    meetingsResult,
    statsResult
  ] = await Promise.all([
    // Active topics (studying status)
    supabase
      .from('topics')
      .select('id, title, status, updated_at')
      .eq('status', 'studying')
      .order('updated_at', { ascending: false })
      .limit(5),
    
    // Recent study sessions
    supabase
      .from('study_sessions')
      .select(`
        id,
        duration_minutes,
        session_date,
        notes,
        topics (id, title)
      `)
      .order('session_date', { ascending: false })
      .limit(5),
    
    // Upcoming meetings
    supabase
      .from('meetings')
      .select(`
        id,
        title,
        meeting_date,
        groups (id, name)
      `)
      .gte('meeting_date', new Date().toISOString())
      .order('meeting_date', { ascending: true })
      .limit(5),
    
    // Stats aggregation
    supabase.rpc('get_user_stats')
  ])

  return {
    activeTopics: topicsResult.data || [],
    recentSessions: sessionsResult.data || [],
    upcomingMeetings: meetingsResult.data || [],
    stats: statsResult.data || { 
      totalTopics: 0, 
      totalStudyMinutes: 0, 
      groupCount: 0 
    }
  }
}
```

### Validation Schemas

```typescript
// src/lib/validations/topics.ts
import { z } from 'zod'

export const topicSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  status: z.enum(['not_started', 'studying', 'completed']).default('not_started'),
  notes: z.string().optional().nullable(),
})

export type TopicInput = z.infer<typeof topicSchema>

// src/lib/validations/resources.ts
export const resourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  url: z.string().url('Must be a valid URL'),
  type: z.enum(['article', 'video', 'documentation', 'github', 'other']),
  topic_id: z.string().uuid().optional().nullable(),
  meeting_id: z.string().uuid().optional().nullable(),
}).refine(
  data => data.topic_id || data.meeting_id,
  'Resource must be attached to a topic or meeting'
)

// src/lib/validations/sessions.ts
export const sessionSchema = z.object({
  topic_id: z.string().uuid('Invalid topic'),
  duration_minutes: z
    .number()
    .int()
    .positive('Duration must be positive')
    .max(1440, 'Duration cannot exceed 24 hours'),
  notes: z.string().max(1000).optional().nullable(),
  session_date: z.string().date(),
})

// src/lib/validations/groups.ts
export const groupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  is_public: z.boolean().default(false),
})

// src/lib/validations/meetings.ts
export const meetingSchema = z.object({
  group_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  presenter_id: z.string().uuid().optional().nullable(),
  meeting_date: z.string().datetime(),
  agenda: z.string().max(2000).optional().nullable(),
})
```

### Middleware for Auth

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const protectedPaths = ['/dashboard', '/topics', '/sessions', '/groups', '/profile']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isAuthPath && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## 5. Key Pages

### Page Component Examples

```typescript
// src/app/(dashboard)/dashboard/page.tsx
import { Suspense } from 'react'
import { getDashboardData } from '@/lib/queries/dashboard'
import { StatsCard } from '@/components/dashboard/stats-card'
import { ActiveTopics } from '@/components/dashboard/active-topics'
import { RecentSessions } from '@/components/dashboard/recent-sessions'
import { UpcomingMeetings } from '@/components/dashboard/upcoming-meetings'
import { PageHeader } from '@/components/shared/page-header'
import { Skeleton } from '@/components/ui/skeleton'

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Dashboard" 
        description="Track your learning progress"
      />

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Topics"
          value={data.stats.totalTopics}
          description="Study topics created"
        />
        <StatsCard
          title="Study Time"
          value={`${Math.round(data.stats.totalStudyMinutes / 60)}h`}
          description="Total hours studied"
        />
        <StatsCard
          title="Groups"
          value={data.stats.groupCount}
          description="Mentorship groups joined"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-[300px]" />}>
          <ActiveTopics topics={data.activeTopics} />
        </Suspense>
        
        <Suspense fallback={<Skeleton className="h-[300px]" />}>
          <UpcomingMeetings meetings={data.upcomingMeetings} />
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton className="h-[200px]" />}>
        <RecentSessions sessions={data.recentSessions} />
      </Suspense>
    </div>
  )
}
```

```typescript
// src/app/(dashboard)/topics/page.tsx
import Link from 'next/link'
import { getTopicsWithStats } from '@/lib/queries/topics'
import { TopicList } from '@/components/topics/topic-list'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'

export default async function TopicsPage() {
  const topics = await getTopicsWithStats()

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Study Topics" 
        description="Manage your learning topics"
      >
        <Button asChild>
          <Link href="/topics/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Topic
          </Link>
        </Button>
      </PageHeader>

      {topics.length === 0 ? (
        <EmptyState
          title="No topics yet"
          description="Create your first study topic to start tracking your learning."
          action={
            <Button asChild>
              <Link href="/topics/new">Create Topic</Link>
            </Button>
          }
        />
      ) : (
        <TopicList topics={topics} />
      )}
    </div>
  )
}
```

```typescript
// src/app/(dashboard)/topics/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getTopic } from '@/lib/queries/topics'
import { TopicForm } from '@/components/topics/topic-form'
import { ResourceList } from '@/components/resources/resource-list'
import { SessionList } from '@/components/sessions/session-list'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/topics/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  params: Promise<{ id: string }>
}

export default async function TopicDetailPage({ params }: Props) {
  const { id } = await params
  
  let topic
  try {
    topic = await getTopic(id)
  } catch {
    notFound()
  }

  const totalStudyTime = topic.study_sessions?.reduce(
    (sum, s) => sum + s.duration_minutes, 0
  ) || 0

  return (
    <div className="space-y-6">
      <PageHeader title={topic.title}>
        <StatusBadge status={topic.status} />
      </PageHeader>

      {topic.description && (
        <p className="text-muted-foreground">{topic.description}</p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={topic.status} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.round(totalStudyTime / 60)}h {totalStudyTime % 60}m
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{topic.resources?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {topic.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{topic.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="resources">
          <ResourceList 
            resources={topic.resources || []} 
            topicId={topic.id} 
          />
        </TabsContent>
        
        <TabsContent value="sessions">
          <SessionList 
            sessions={topic.study_sessions || []} 
            topicId={topic.id} 
          />
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Edit Topic</CardTitle>
            </CardHeader>
            <CardContent>
              <TopicForm topic={topic} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

```typescript
// src/app/(dashboard)/groups/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getGroup, getGroupMeetings } from '@/lib/queries/groups'
import { MeetingList } from '@/components/meetings/meeting-list'
import { MemberList } from '@/components/groups/member-list'
import { InviteDialog } from '@/components/groups/invite-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarPlusIcon, SettingsIcon } from 'lucide-react'

type Props = {
  params: Promise<{ id: string }>
}

export default async function GroupPage({ params }: Props) {
  const { id } = await params
  
  let group
  try {
    group = await getGroup(id)
  } catch {
    notFound()
  }

  const meetings = await getGroupMeetings(id)
  const upcomingMeetings = meetings.filter(m => new Date(m.meeting_date) >= new Date())
  const pastMeetings = meetings.filter(m => new Date(m.meeting_date) < new Date())

  return (
    <div className="space-y-6">
      <PageHeader title={group.name} description={group.description}>
        <div className="flex gap-2">
          <InviteDialog groupId={group.id} inviteCode={group.invite_code} />
          <Button asChild>
            <Link href={`/groups/${id}/meetings/new`}>
              <CalendarPlusIcon className="mr-2 h-4 w-4" />
              New Meeting
            </Link>
          </Button>
          {group.isAdmin && (
            <Button variant="outline" asChild>
              <Link href={`/groups/${id}/settings`}>
                <SettingsIcon className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </PageHeader>

      <Tabs defaultValue="meetings">
        <TabsList>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="members">
            Members ({group.members?.length || 0})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="meetings" className="space-y-6">
          {upcomingMeetings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                <MeetingList meetings={upcomingMeetings} groupId={id} />
              </CardContent>
            </Card>
          )}
          
          {pastMeetings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Past Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                <MeetingList meetings={pastMeetings} groupId={id} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="members">
          <MemberList 
            members={group.members || []} 
            groupId={id}
            isAdmin={group.isAdmin}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

```typescript
// src/app/(dashboard)/groups/[id]/meetings/[meetingId]/page.tsx
import { notFound } from 'next/navigation'
import { getMeeting } from '@/lib/queries/meetings'
import { ResourceList } from '@/components/resources/resource-list'
import { CommentSection } from '@/components/meetings/comment-section'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarIcon, ClockIcon, UserIcon } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils/dates'

type Props = {
  params: Promise<{ id: string; meetingId: string }>
}

export default async function MeetingPage({ params }: Props) {
  const { id: groupId, meetingId } = await params
  
  let meeting
  try {
    meeting = await getMeeting(meetingId)
  } catch {
    notFound()
  }

  const meetingDate = new Date(meeting.meeting_date)
  const isPast = meetingDate < new Date()

  return (
    <div className="space-y-6">
      <PageHeader title={meeting.title}>
        <Badge variant={isPast ? 'secondary' : 'default'}>
          {isPast ? 'Completed' : 'Upcoming'}
        </Badge>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(meetingDate)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <ClockIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-medium">{formatTime(meetingDate)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <UserIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Presenter</p>
              {meeting.presenter ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={meeting.presenter.avatar_url} />
                    <AvatarFallback>
                      {meeting.presenter.full_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {meeting.presenter.full_name || meeting.presenter.username}
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground">TBD</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {meeting.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{meeting.description}</p>
              </CardContent>
            </Card>
          )}
          
          {meeting.agenda && (
            <Card>
              <CardHeader>
                <CardTitle>Agenda</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{meeting.agenda}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="resources">
          <ResourceList 
            resources={meeting.resources || []} 
            meetingId={meeting.id}
          />
        </TabsContent>
        
        <TabsContent value="discussion">
          <CommentSection 
            meetingId={meeting.id} 
            comments={meeting.comments || []} 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### Page Summary Table

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Public landing page with features |
| `/login` | Login | Email/password or OAuth login |
| `/signup` | Sign Up | Registration form |
| `/dashboard` | Dashboard | Overview of topics, sessions, meetings |
| `/topics` | Topics List | All user's study topics |
| `/topics/new` | Create Topic | Form to create new topic |
| `/topics/[id]` | Topic Detail | Topic info, resources, sessions |
| `/sessions` | Sessions List | All study sessions with filters |
| `/sessions/new` | Log Session | Form to log new study session |
| `/groups` | Groups List | User's groups + discover |
| `/groups/new` | Create Group | Form to create new group |
| `/groups/join` | Join Group | Join via invite code |
| `/groups/[id]` | Group Overview | Meetings, members |
| `/groups/[id]/settings` | Group Settings | Admin settings |
| `/groups/[id]/meetings/new` | Create Meeting | Schedule new meeting |
| `/groups/[id]/meetings/[meetingId]` | Meeting Detail | Agenda, resources, comments |
| `/profile` | User Profile | Edit profile, preferences |

---

## 6. Implementation Plan

### Phase Overview

```
Phase 1: Foundation (Week 1)
├── Project setup
├── Authentication
└── Database schema

Phase 2: Personal Tracking (Week 2)
├── Topics CRUD
├── Resources
└── Study sessions

Phase 3: Groups & Collaboration (Week 3)
├── Groups CRUD
├── Membership
└── Meetings

Phase 4: Polish & Deploy (Week 4)
├── Dashboard
├── UI polish
└── Production deployment
```

### Detailed Phase Breakdown

---

#### Phase 1: Foundation (5-7 days)

**Day 1-2: Project Setup**
- [ ] Initialize Next.js project with App Router
  ```bash
  npx create-next-app@latest studytrack --typescript --tailwind --eslint --app
  ```
- [ ] Install and configure shadcn/ui
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add button card input label textarea select dialog dropdown-menu avatar badge tabs toast
  ```
- [ ] Set up Supabase project
  - Create project at supabase.com
  - Note URL and anon key
- [ ] Configure environment variables
  ```env
  NEXT_PUBLIC_SUPABASE_URL=your-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```
- [ ] Install Supabase packages
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```
- [ ] Set up Supabase clients (client.ts, server.ts)
- [ ] Configure TypeScript types generation
  ```bash
  npx supabase gen types typescript --project-id your-project > src/types/database.ts
  ```

**Day 3-4: Database Schema**
- [ ] Run migrations in Supabase SQL editor
  - Create all tables (profiles, topics, resources, etc.)
  - Create enums (topic_status, resource_type, member_role)
  - Create indexes
  - Create triggers (auto-create profile, updated_at)
- [ ] Set up RLS policies
  - Enable RLS on all tables
  - Create helper functions (is_group_member, etc.)
  - Apply all policies
- [ ] Test RLS with Supabase dashboard
- [ ] Generate TypeScript types

**Day 5-6: Authentication**
- [ ] Set up Next.js middleware for auth
- [ ] Create auth layouts and pages
  - `/login` page with form
  - `/signup` page with form
- [ ] Implement auth actions
  - Sign up with email/password
  - Log in
  - Log out
  - OAuth (GitHub optional)
- [ ] Set up auth callback route
- [ ] Create auth provider/context
- [ ] Test auth flow end-to-end

**Day 7: Layout & Navigation**
- [ ] Create dashboard layout with sidebar
- [ ] Build navigation components
  - Sidebar with nav links
  - Header with user menu
  - Mobile responsive nav
- [ ] Create shared components
  - PageHeader
  - EmptyState
  - LoadingSpinner
  - ConfirmDialog

---

#### Phase 2: Personal Study Tracking (5-7 days)

**Day 8-9: Topics**
- [ ] Create validation schemas (Zod)
- [ ] Implement server actions
  - createTopic
  - updateTopic
  - deleteTopic
  - updateTopicStatus
- [ ] Create query functions
  - getTopics
  - getTopic (with resources, sessions)
  - getTopicsWithStats
- [ ] Build UI components
  - TopicCard
  - TopicList
  - TopicForm
  - StatusBadge
- [ ] Create pages
  - `/topics` - list with filters
  - `/topics/new` - create form
  - `/topics/[id]` - detail with tabs

**Day 10-11: Resources**
- [ ] Implement server actions
  - createResource
  - deleteResource
- [ ] Build UI components
  - ResourceCard
  - ResourceList
  - ResourceForm (modal)
  - ResourceTypeIcon
- [ ] Integrate with topic detail page
- [ ] Test resource attachment

**Day 12-13: Study Sessions**
- [ ] Implement server actions
  - createSession
  - updateSession
  - deleteSession
- [ ] Create query functions
  - getSessions (with filters)
  - getSessionsByTopic
- [ ] Build UI components
  - SessionCard
  - SessionList
  - SessionForm
  - DurationDisplay
- [ ] Create pages
  - `/sessions` - list with date filters
  - `/sessions/new` - log form with topic selector

**Day 14: Testing & Refinement**
- [ ] Test all CRUD operations
- [ ] Verify RLS is working correctly
- [ ] Fix any UI/UX issues
- [ ] Add loading and error states

---

#### Phase 3: Groups & Collaboration (5-7 days)

**Day 15-16: Groups**
- [ ] Implement server actions
  - createGroup
  - updateGroup
  - deleteGroup
  - joinGroup (via invite code)
  - leaveGroup
- [ ] Create query functions
  - getGroups (user's groups)
  - getGroup (with members)
  - getPublicGroups (optional)
- [ ] Build UI components
  - GroupCard
  - GroupList
  - GroupForm
  - InviteDialog
- [ ] Create pages
  - `/groups` - list
  - `/groups/new` - create
  - `/groups/join` - join via code
  - `/groups/[id]` - overview

**Day 17-18: Group Members**
- [ ] Implement server actions
  - addMember (admin only)
  - removeMember
  - updateMemberRole
- [ ] Build UI components
  - MemberCard
  - MemberList
  - RoleBadge
- [ ] Create member management page
  - `/groups/[id]/members`
- [ ] Create group settings page (admin)
  - `/groups/[id]/settings`

**Day 19-20: Meetings**
- [ ] Implement server actions
  - createMeeting
  - updateMeeting
  - deleteMeeting
- [ ] Create query functions
  - getGroupMeetings
  - getMeeting (with resources, comments)
  - getUpcomingMeetings (for dashboard)
- [ ] Build UI components
  - MeetingCard
  - MeetingList
  - MeetingForm
  - AgendaDisplay
- [ ] Create pages
  - `/groups/[id]/meetings/new`
  - `/groups/[id]/meetings/[meetingId]`

**Day 21: Comments**
- [ ] Implement server actions
  - createComment
  - updateComment
  - deleteComment
- [ ] Build CommentSection component
- [ ] Integrate with meeting detail page
- [ ] (Optional) Add Supabase Realtime for live updates

---

#### Phase 4: Dashboard & Polish (5-7 days)

**Day 22-23: Dashboard**
- [ ] Create dashboard query function
  - Aggregate stats
  - Active topics
  - Recent sessions
  - Upcoming meetings
- [ ] Build dashboard components
  - StatsCard
  - ActiveTopics widget
  - RecentSessions widget
  - UpcomingMeetings widget
- [ ] Create dashboard page with grid layout
- [ ] Add quick actions (log session, etc.)

**Day 24-25: UI Polish**
- [ ] Review and improve all forms
- [ ] Add proper loading states (Suspense)
- [ ] Add error boundaries
- [ ] Improve empty states
- [ ] Add toast notifications for actions
- [ ] Mobile responsiveness audit
- [ ] Accessibility audit (focus, aria labels)

**Day 26: User Profile**
- [ ] Create profile page
  - Edit name, username, bio
  - Avatar upload (optional)
- [ ] Add profile settings

**Day 27-28: Production Prep**
- [ ] Set up production Supabase project
- [ ] Configure production environment variables
- [ ] Deploy to Vercel
  - Connect GitHub repo
  - Add env vars
  - Deploy
- [ ] Test production deployment
- [ ] Set up custom domain (optional)
- [ ] Monitor for errors

---

### Development Checklist Summary

```
Week 1: Foundation
□ Project setup (Next.js, Tailwind, shadcn/ui)
□ Supabase setup (project, schema, RLS)
□ Authentication (login, signup, middleware)
□ Base layout and navigation

Week 2: Personal Features
□ Topics CRUD
□ Resources CRUD
□ Study Sessions CRUD
□ Topics-Resources-Sessions integration

Week 3: Collaboration
□ Groups CRUD
□ Membership management
□ Meetings CRUD
□ Comments (with optional Realtime)

Week 4: Polish & Launch
□ Dashboard with aggregated data
□ UI/UX polish
□ User profile
□ Production deployment
```

---

## Quick Reference

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Key Commands

```bash
# Development
npm run dev

# Generate Supabase types
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts

# Add shadcn components
npx shadcn@latest add <component-name>

# Build for production
npm run build

# Deploy to Vercel
vercel
```

### Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "zod": "^3.x",
    "date-fns": "^3.x",
    "lucide-react": "^0.x"
  }
}
```

---

## Notes for Future Expansion

Once the MVP is stable, consider these enhancements:

1. **Study Analytics**
   - Charts showing study time over weeks/months
   - Topic completion trends
   - Group engagement metrics

2. **Notifications**
   - Email reminders for upcoming meetings
   - Study streak notifications
   - Group activity digest

3. **Advanced Features**
   - Meeting recording links
   - Integrated video calls (Zoom/Meet links)
   - Public group discovery
   - User following/mentorship connections

4. **Mobile App**
   - React Native app for quick session logging
   - Push notifications for meetings

5. **Integrations**
   - Import resources from Notion, GitHub
   - Export study logs to PDF/CSV
   - Calendar sync (Google Calendar, iCal)

---

*This architecture document provides a solid foundation for the StudyTrack MVP. Follow the phase-by-phase implementation plan for systematic development.*
