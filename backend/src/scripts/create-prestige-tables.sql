-- Adventure Platform Prestige System Database Schema
-- Run this script to create the necessary tables for the prestige system

-- Create prestige_systems table
CREATE TABLE IF NOT EXISTS prestige_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prestige_level INTEGER DEFAULT 0 CHECK (prestige_level >= 0 AND prestige_level <= 20),
    total_prestige_points INTEGER DEFAULT 0 CHECK (total_prestige_points >= 0),
    current_season_points INTEGER DEFAULT 0 CHECK (current_season_points >= 0),
    season_id VARCHAR(50) NOT NULL,
    tier VARCHAR(20) DEFAULT 'initiate' CHECK (tier IN ('initiate', 'ascendant', 'luminary', 'transcendent', 'eternal')),
    unlocked_story_arcs JSONB DEFAULT '[]'::jsonb,
    unlocked_cosmetics JSONB DEFAULT '[]'::jsonb,
    unlocked_titles JSONB DEFAULT '[]'::jsonb,
    mentor_status BOOLEAN DEFAULT false,
    lifetime_hours_played INTEGER DEFAULT 0 CHECK (lifetime_hours_played >= 0),
    skill_masteries JSONB DEFAULT '{}'::jsonb,
    last_prestige_date TIMESTAMP,
    season_start_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_prestige UNIQUE(user_id)
);

-- Create seasonal_tracks table
CREATE TABLE IF NOT EXISTS seasonal_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    season_id VARCHAR(50) NOT NULL,
    track_type VARCHAR(20) NOT NULL CHECK (track_type IN ('exploration', 'mastery', 'social', 'creative', 'narrative')),
    current_tier INTEGER DEFAULT 1 CHECK (current_tier >= 1 AND current_tier <= 50),
    current_progress INTEGER DEFAULT 0 CHECK (current_progress >= 0),
    tier_threshold INTEGER DEFAULT 100 CHECK (tier_threshold > 0),
    total_points_earned INTEGER DEFAULT 0 CHECK (total_points_earned >= 0),
    completed_challenges JSONB DEFAULT '[]'::jsonb,
    unlocked_rewards JSONB DEFAULT '[]'::jsonb,
    premium_track BOOLEAN DEFAULT false,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    season_start_date TIMESTAMP NOT NULL,
    season_end_date TIMESTAMP NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_season_track UNIQUE(user_id, season_id, track_type),
    CONSTRAINT valid_season_dates CHECK (season_end_date > season_start_date)
);

-- Create prestige_rewards table
CREATE TABLE IF NOT EXISTS prestige_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('cosmetic', 'story_arc', 'title', 'emote', 'ability', 'customization', 'social', 'legacy')),
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
    unlock_requirements JSONB NOT NULL,
    reward_data JSONB NOT NULL,
    category VARCHAR(100),
    is_seasonal BOOLEAN DEFAULT false,
    season_id VARCHAR(50),
    is_exclusive BOOLEAN DEFAULT true,
    max_quantity INTEGER DEFAULT 1,
    intrinsic_value INTEGER DEFAULT 100 CHECK (intrinsic_value >= 0),
    social_recognition BOOLEAN DEFAULT true,
    icon_url VARCHAR(500),
    preview_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prestige_systems_user_id ON prestige_systems(user_id);
CREATE INDEX IF NOT EXISTS idx_prestige_systems_season_id ON prestige_systems(season_id);
CREATE INDEX IF NOT EXISTS idx_prestige_systems_tier ON prestige_systems(tier);
CREATE INDEX IF NOT EXISTS idx_prestige_systems_prestige_level ON prestige_systems(prestige_level);

CREATE INDEX IF NOT EXISTS idx_seasonal_tracks_user_id ON seasonal_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_tracks_season_id ON seasonal_tracks(season_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_tracks_track_type ON seasonal_tracks(track_type);
CREATE INDEX IF NOT EXISTS idx_seasonal_tracks_user_season ON seasonal_tracks(user_id, season_id);

CREATE INDEX IF NOT EXISTS idx_prestige_rewards_reward_type ON prestige_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_prestige_rewards_rarity ON prestige_rewards(rarity);
CREATE INDEX IF NOT EXISTS idx_prestige_rewards_category ON prestige_rewards(category);
CREATE INDEX IF NOT EXISTS idx_prestige_rewards_season_id ON prestige_rewards(season_id);
CREATE INDEX IF NOT EXISTS idx_prestige_rewards_is_seasonal ON prestige_rewards(is_seasonal);
CREATE INDEX IF NOT EXISTS idx_prestige_rewards_is_active ON prestige_rewards(is_active);

-- Create update trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all prestige tables
CREATE TRIGGER update_prestige_systems_updated_at 
    BEFORE UPDATE ON prestige_systems 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasonal_tracks_updated_at 
    BEFORE UPDATE ON seasonal_tracks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prestige_rewards_updated_at 
    BEFORE UPDATE ON prestige_rewards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial season configuration
INSERT INTO prestige_rewards (name, description, reward_type, rarity, unlock_requirements, reward_data, category, intrinsic_value, icon_url)
VALUES 
('Prologue Extended: The First Steps', 'An expanded introduction to the mysteries of the realm, revealing the ancient powers that await those who dare to ascend.', 'story_arc', 'common', '{"tier": "initiate"}', '{"story_arc_id": "prologue_extended", "chapter_count": 3, "estimated_playtime": 120}', 'initiate_collection', 200, '/icons/story/prologue_extended.png'),

('Awakened Aura', 'A subtle shimmer that surrounds those who have begun their journey of ascension.', 'cosmetic', 'common', '{"tier": "initiate"}', '{"cosmetic_id": "aura_awakened", "slot": "aura", "visual_effects": ["subtle_shimmer", "gentle_glow"]}', 'initiate_collection', 50, '/icons/cosmetics/aura_awakened.png'),

('The Awakened', 'A title bestowed upon those who have taken their first steps into the realm of ascension.', 'title', 'common', '{"tier": "initiate"}', '{"title_text": "The Awakened", "title_color": "#87CEEB"}', 'initiate_collection', 75, '/icons/titles/the_awakened.png')

ON CONFLICT DO NOTHING;

-- Create a view for prestige leaderboards
CREATE OR REPLACE VIEW prestige_leaderboard AS
SELECT 
    ps.user_id,
    u.username,
    u.display_name,
    ps.prestige_level,
    ps.tier,
    ps.total_prestige_points,
    ps.current_season_points,
    ps.season_id,
    RANK() OVER (ORDER BY ps.total_prestige_points DESC) as all_time_rank,
    RANK() OVER (PARTITION BY ps.season_id ORDER BY ps.current_season_points DESC) as season_rank
FROM prestige_systems ps
JOIN users u ON ps.user_id = u.id
WHERE ps.is_active = true AND u.is_active = true;

-- Create a view for seasonal track summary
CREATE OR REPLACE VIEW seasonal_track_summary AS
SELECT 
    st.user_id,
    st.season_id,
    COUNT(*) as total_tracks,
    SUM(st.total_points_earned) as total_seasonal_points,
    AVG(st.current_tier::float) as average_tier,
    COUNT(CASE WHEN st.is_completed THEN 1 END) as completed_tracks
FROM seasonal_tracks st
GROUP BY st.user_id, st.season_id;

COMMENT ON TABLE prestige_systems IS 'Core prestige system data for high-level players (100+)';
COMMENT ON TABLE seasonal_tracks IS 'Time-limited progression tracks that reset each season';
COMMENT ON TABLE prestige_rewards IS 'Catalog of all available prestige rewards and their unlock requirements';
COMMENT ON VIEW prestige_leaderboard IS 'Ranked view of all prestige players for leaderboard display';
COMMENT ON VIEW seasonal_track_summary IS 'Aggregated seasonal track progress per player and season';

-- Success message
SELECT 'Prestige system tables created successfully!' as status;