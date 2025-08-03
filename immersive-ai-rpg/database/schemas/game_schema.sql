-- Complete Database Schema for Immersive AI RPG

-- Create database
CREATE DATABASE IF NOT EXISTS immersive_rpg;
USE immersive_rpg;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('player', 'admin', 'moderator') DEFAULT 'player',
    status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    settings JSON,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Games table (active game sessions)
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    world_id UUID NOT NULL,
    status ENUM('active', 'paused', 'completed', 'abandoned') DEFAULT 'active',
    difficulty ENUM('novice', 'standard', 'veteran', 'master', 'legendary') DEFAULT 'standard',
    play_time_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_save TIMESTAMP,
    game_state JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (world_id) REFERENCES worlds(id),
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_status (status)
);

-- Worlds table
CREATE TABLE IF NOT EXISTS worlds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    theme ENUM('fantasy', 'scifi', 'cyberpunk', 'horror', 'mixed') NOT NULL,
    description TEXT,
    seed VARCHAR(100),
    world_data JSON NOT NULL,
    is_template BOOLEAN DEFAULT FALSE,
    creator_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_theme (theme),
    INDEX idx_template (is_template)
);

-- Players (characters)
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    class VARCHAR(50) NOT NULL,
    race VARCHAR(50),
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    hp_current INT DEFAULT 100,
    hp_max INT DEFAULT 100,
    mana_current INT DEFAULT 50,
    mana_max INT DEFAULT 50,
    strength INT DEFAULT 10,
    dexterity INT DEFAULT 10,
    intelligence INT DEFAULT 10,
    wisdom INT DEFAULT 10,
    charisma INT DEFAULT 10,
    constitution INT DEFAULT 10,
    gold INT DEFAULT 0,
    location_id UUID,
    appearance JSON,
    backstory TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    INDEX idx_game_id (game_id)
);

-- NPCs table
CREATE TABLE IF NOT EXISTS npcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('merchant', 'quest_giver', 'companion', 'enemy', 'neutral') NOT NULL,
    location_id UUID,
    personality JSON,
    dialogue_tree JSON,
    stats JSON,
    inventory JSON,
    faction_id UUID,
    is_alive BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
    INDEX idx_world_id (world_id),
    INDEX idx_type (type),
    INDEX idx_location (location_id)
);

-- Quests table
CREATE TABLE IF NOT EXISTS quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('main', 'side', 'daily', 'event') DEFAULT 'side',
    giver_id UUID,
    objectives JSON NOT NULL,
    rewards JSON,
    requirements JSON,
    is_repeatable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
    FOREIGN KEY (giver_id) REFERENCES npcs(id) ON DELETE SET NULL,
    INDEX idx_world_id (world_id),
    INDEX idx_type (type)
);

-- Player quests (quest progress)
CREATE TABLE IF NOT EXISTS player_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    quest_id UUID NOT NULL,
    status ENUM('active', 'completed', 'failed', 'abandoned') DEFAULT 'active',
    progress JSON,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_quest (player_id, quest_id),
    INDEX idx_player_id (player_id),
    INDEX idx_status (status)
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type ENUM('weapon', 'armor', 'consumable', 'quest', 'misc') NOT NULL,
    rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') DEFAULT 'common',
    description TEXT,
    stats JSON,
    effects JSON,
    value INT DEFAULT 0,
    weight DECIMAL(10, 2) DEFAULT 0,
    icon_url VARCHAR(500),
    stackable BOOLEAN DEFAULT FALSE,
    max_stack INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_rarity (rarity)
);

-- Player inventory
CREATE TABLE IF NOT EXISTS player_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    item_id UUID NOT NULL,
    quantity INT DEFAULT 1,
    equipped BOOLEAN DEFAULT FALSE,
    slot VARCHAR(50),
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_player_id (player_id),
    INDEX idx_equipped (equipped)
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('city', 'town', 'village', 'dungeon', 'wilderness', 'special') NOT NULL,
    coordinates JSON,
    description TEXT,
    environment JSON,
    connections JSON,
    npcs JSON,
    items JSON,
    dangers JSON,
    discovered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
    INDEX idx_world_id (world_id),
    INDEX idx_type (type)
);

-- Game saves
CREATE TABLE IF NOT EXISTS game_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL,
    user_id UUID NOT NULL,
    save_name VARCHAR(255) NOT NULL,
    save_data JSON NOT NULL,
    screenshot_url VARCHAR(500),
    play_time_minutes INT,
    player_level INT,
    location_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_game_id (game_id)
);

-- Assets (generated images, audio, etc.)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type ENUM('image', 'audio', 'video') NOT NULL,
    category VARCHAR(100),
    url VARCHAR(500) NOT NULL,
    metadata JSON,
    prompt TEXT,
    generation_params JSON,
    file_size INT,
    dimensions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_type (type),
    INDEX idx_category (category)
);

-- Combat logs
CREATE TABLE IF NOT EXISTS combat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL,
    player_id UUID NOT NULL,
    enemy_data JSON NOT NULL,
    combat_log JSON NOT NULL,
    outcome ENUM('victory', 'defeat', 'flee') NOT NULL,
    duration_seconds INT,
    rewards JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    INDEX idx_game_id (game_id),
    INDEX idx_player_id (player_id),
    INDEX idx_outcome (outcome)
);

-- Dialogue history
CREATE TABLE IF NOT EXISTS dialogue_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL,
    player_id UUID NOT NULL,
    npc_id UUID NOT NULL,
    dialogue JSON NOT NULL,
    choices_made JSON,
    relationship_change INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (npc_id) REFERENCES npcs(id) ON DELETE CASCADE,
    INDEX idx_game_id (game_id),
    INDEX idx_player_id (player_id)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    points INT DEFAULT 10,
    requirements JSON,
    icon_url VARCHAR(500),
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player achievements
CREATE TABLE IF NOT EXISTS player_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_id UUID NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    game_id UUID,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user_id (user_id)
);

-- Factions
CREATE TABLE IF NOT EXISTS factions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    alignment ENUM('lawful_good', 'neutral_good', 'chaotic_good', 'lawful_neutral', 'true_neutral', 'chaotic_neutral', 'lawful_evil', 'neutral_evil', 'chaotic_evil') DEFAULT 'true_neutral',
    base_location_id UUID,
    leader_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
    INDEX idx_world_id (world_id)
);

-- Player faction relationships
CREATE TABLE IF NOT EXISTS player_factions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    faction_id UUID NOT NULL,
    reputation INT DEFAULT 0,
    rank VARCHAR(100),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (faction_id) REFERENCES factions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_faction (player_id, faction_id),
    INDEX idx_player_id (player_id)
);