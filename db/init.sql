-- NPC World Database Schema
-- Deterministic tick-based simulation system

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS npcworld;
USE npcworld;

-- Worlds table: stores different simulation worlds
CREATE TABLE IF NOT EXISTS worlds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    seed VARCHAR(255) NOT NULL,
    current_tick BIGINT DEFAULT 0,
    tick_rate_ms INT DEFAULT 1000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'paused', 'stopped') DEFAULT 'active',
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Entities table: NPCs and other entities in the simulation
CREATE TABLE IF NOT EXISTS entities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    world_id INT NOT NULL,
    entity_type ENUM('npc', 'object', 'resource') DEFAULT 'npc',
    name VARCHAR(255) NOT NULL,
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    position_z FLOAT DEFAULT 0,
    state JSON,
    health INT DEFAULT 100,
    energy INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
    INDEX idx_world_id (world_id),
    INDEX idx_entity_type (entity_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events table: logs all events that occur in the simulation
CREATE TABLE IF NOT EXISTS events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    world_id INT NOT NULL,
    entity_id INT,
    event_type VARCHAR(100) NOT NULL,
    tick_number BIGINT NOT NULL,
    event_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE SET NULL,
    INDEX idx_world_tick (world_id, tick_number),
    INDEX idx_entity_id (entity_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Players table: human players who can observe and interact
CREATE TABLE IF NOT EXISTS players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assignments table: links players to entities they control/observe
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    entity_id INT NOT NULL,
    world_id INT NOT NULL,
    role ENUM('observer', 'controller', 'admin') DEFAULT 'observer',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_entity (player_id, entity_id),
    INDEX idx_player_id (player_id),
    INDEX idx_entity_id (entity_id),
    INDEX idx_world_id (world_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ideas table: stores ideas/goals/intentions for entities
CREATE TABLE IF NOT EXISTS ideas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_id INT NOT NULL,
    world_id INT NOT NULL,
    idea_text TEXT NOT NULL,
    priority INT DEFAULT 5,
    status ENUM('pending', 'active', 'completed', 'abandoned') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    result_data JSON,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
    INDEX idx_entity_status (entity_id, status),
    INDEX idx_world_id (world_id),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial test world
INSERT INTO worlds (name, seed, tick_rate_ms) VALUES 
    ('Default World', '12345', 1000);

-- Insert some test entities
INSERT INTO entities (world_id, entity_type, name, position_x, position_y, position_z, state) VALUES
    (1, 'npc', 'Alice', 0, 0, 0, '{"mood": "curious", "occupation": "explorer"}'),
    (1, 'npc', 'Bob', 10, 5, 0, '{"mood": "cautious", "occupation": "merchant"}'),
    (1, 'npc', 'Charlie', -5, 8, 0, '{"mood": "friendly", "occupation": "farmer"}');
