# NPC World - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │              │  │              │  │                    │    │
│  │  Web Browser │  │   cURL/API   │  │  WebSocket Client  │    │
│  │              │  │   Client     │  │                    │    │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘    │
│         │                 │                     │               │
└─────────┼─────────────────┼─────────────────────┼───────────────┘
          │                 │                     │
          │ HTTP            │ HTTP/REST           │ WebSocket
          │ (Port 8080)     │ (Port 3000)        │ (Port 3000)
          │                 │                     │
┌─────────▼─────────────────▼─────────────────────▼───────────────┐
│                      Application Layer                           │
├──────────────────────────────┬───────────────────────────────────┤
│                              │                                   │
│  ┌──────────────────────┐   │   ┌───────────────────────────┐  │
│  │   PHP Web Server     │   │   │   Node.js API Server      │  │
│  │   (Apache + PHP)     │   │   │   (Express + WebSocket)   │  │
│  │                      │   │   │                           │  │
│  │  ┌────────────────┐  │   │   │  ┌──────────────────┐    │  │
│  │  │ register.php   │  │   │   │  │  REST API        │    │  │
│  │  │ index.html     │  │   │   │  │  - /worlds       │    │  │
│  │  │ client.html    │  │   │   │  │  - /entities     │    │  │
│  │  └────────────────┘  │   │   │  │  - /admin        │    │  │
│  │                      │   │   │  └──────────────────┘    │  │
│  │  Port: 8080          │   │   │                           │  │
│  └──────────┬───────────┘   │   │  ┌──────────────────┐    │  │
│             │               │   │  │  WebSocket       │    │  │
│             │               │   │  │  Server          │    │  │
│             │               │   │  │  - /ws endpoint  │    │  │
│             │               │   │  └──────────────────┘    │  │
│             │               │   │                           │  │
│             │               │   │  ┌──────────────────┐    │  │
│             │               │   │  │  Simulation      │    │  │
│             │               │   │  │  Engine          │    │  │
│             │               │   │  │  - Tick system   │    │  │
│             │               │   │  │  - Seeded PRNG   │    │  │
│             │               │   │  └──────────────────┘    │  │
│             │               │   │                           │  │
│             │               │   │  Port: 3000 (HTTP)        │  │
│             │               │   │  Port: 3001 (WebSocket)   │  │
│             │               │   └───────────┬───────────────┘  │
│             │               │               │                  │
└─────────────┼───────────────┴───────────────┼──────────────────┘
              │                               │
              │ MySQL Protocol                │ MySQL Protocol
              │ (Port 3306)                   │ (Port 3306)
              │                               │
┌─────────────▼───────────────────────────────▼──────────────────┐
│                      Data Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │             MySQL Database Server                       │    │
│  │                                                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │    │
│  │  │  worlds  │  │ entities │  │  events  │           │    │
│  │  └──────────┘  └──────────┘  └──────────┘           │    │
│  │                                                         │    │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────┐        │    │
│  │  │ players  │  │ assignments  │  │  ideas  │        │    │
│  │  └──────────┘  └──────────────┘  └─────────┘        │    │
│  │                                                         │    │
│  │  Port: 3306                                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### 1. PHP Web Server (Port 8080)
**Container:** `npcworld_php`
**Technology:** PHP 8.2 + Apache

**Functions:**
- Serve static HTML pages (home, client)
- Handle player registration via `register.php`
- Form validation and password hashing
- Direct database interaction for user registration

**Files:**
- `public/index.html` - Landing page with feature overview
- `public/register.php` - Player registration with database integration
- `public/client.html` - WebSocket client interface

### 2. Node.js API Server (Port 3000)
**Container:** `npcworld_api`
**Technology:** Node.js 18 + Express + WebSocket

**Functions:**
- RESTful API for world and entity management
- Admin API with Bearer token authentication
- WebSocket server for real-time updates
- Deterministic simulation engine
- Database connection pooling

**Components:**

#### REST API Routes
- **Public Endpoints:**
  - `GET /` - API documentation
  - `GET /health` - Health check
  - `GET /worlds` - List all worlds
  - `GET /worlds/:id` - Get world details with entities
  - `POST /worlds/:id/join` - Join world as player
  - `GET /entities/:id` - Get entity details with ideas
  - `POST /entities/:id/idea` - Add idea to entity

- **Admin Endpoints (Protected):**
  - `GET /admin/worlds` - List all worlds
  - `POST /admin/worlds` - Create new world
  - `POST /admin/worlds/:id/start` - Start simulation
  - `POST /admin/worlds/:id/stop` - Stop simulation
  - `GET /admin/entities` - List all entities
  - `POST /admin/entities` - Create entity
  - `GET /admin/events` - Query events with filters
  - `GET /admin/stats` - System statistics

#### WebSocket Server
- **Endpoint:** `ws://localhost:3000/ws`
- **Actions:**
  - `subscribe` - Subscribe to entity updates by ID
  - `unsubscribe` - Unsubscribe from all updates
- **Broadcasts:**
  - Real-time entity state updates
  - Position changes, energy levels, state modifications

#### Simulation Engine
**File:** `src/simulation/engine.js`

**Features:**
- Per-world initialization with seed loading
- Deterministic PRNG using `seedrandom` library
- Configurable tick rate (default: 1000ms)
- Entity state management
- Event logging
- Automated position updates
- Energy/health calculations

**Algorithm:**
1. Load world data and seed
2. Initialize PRNG with seed
3. Load all active entities
4. Every tick:
   - For each entity:
     - Calculate new position using PRNG
     - Update energy using PRNG
     - Write changes to database
     - Log events (sampling rate)
   - Increment world tick counter
   - Broadcast updates to WebSocket clients

### 3. MySQL Database (Port 3306)
**Container:** `npcworld_mysql`
**Technology:** MySQL 8.0

**Schema:**

#### worlds
- `id` - Primary key
- `name` - World name
- `seed` - PRNG seed (string)
- `current_tick` - Current simulation tick
- `tick_rate_ms` - Milliseconds per tick
- `status` - active/paused/stopped
- `created_at`, `updated_at`

#### entities
- `id` - Primary key
- `world_id` - Foreign key to worlds
- `entity_type` - npc/object/resource
- `name` - Entity name
- `position_x`, `position_y`, `position_z` - 3D coordinates
- `state` - JSON field for custom state
- `health`, `energy` - Status attributes
- `is_active` - Soft delete flag

#### events
- `id` - Primary key (BIGINT for large volume)
- `world_id` - Foreign key to worlds
- `entity_id` - Foreign key to entities (nullable)
- `event_type` - Event category
- `tick_number` - Tick when event occurred
- `event_data` - JSON event payload
- `created_at`

#### players
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password_hash` - Hashed password
- `created_at`, `last_login`
- `is_active` - Account status

#### assignments
- `id` - Primary key
- `player_id` - Foreign key to players
- `entity_id` - Foreign key to entities
- `world_id` - Foreign key to worlds
- `role` - observer/controller/admin
- `assigned_at`

#### ideas
- `id` - Primary key (BIGINT)
- `entity_id` - Foreign key to entities
- `world_id` - Foreign key to worlds
- `idea_text` - Goal/intention description
- `priority` - 1-10 priority level
- `status` - pending/active/completed/abandoned
- `created_at`, `completed_at`
- `result_data` - JSON result payload

## Data Flow Examples

### Example 1: Player Joins World

1. Client sends POST request to `/worlds/1/join`
   ```json
   {
     "player_id": 1,
     "entity_id": 2
   }
   ```

2. Node.js API validates world and entity exist
3. Creates assignment in database
4. Returns success response with assignment details

### Example 2: WebSocket Real-Time Updates

1. Client connects to `ws://localhost:3000/ws`
2. Client subscribes: `{"action": "subscribe", "entity_id": 1}`
3. Simulation engine updates entity position on each tick
4. Server broadcasts update to subscribed clients:
   ```json
   {
     "type": "entity_update",
     "entity_id": 1,
     "data": {
       "position_x": 10.5,
       "position_y": 5.2,
       "energy": 85
     }
   }
   ```

### Example 3: Deterministic Simulation

1. World created with seed "12345"
2. Simulation engine initializes PRNG: `seedrandom("12345")`
3. On each tick:
   - Generate random values: `rng()` (0.0 to 1.0)
   - Calculate delta: `(rng() - 0.5) * 2`
   - Update position: `new_x = old_x + delta_x`
4. Same seed + same starting state = identical results

### Example 4: Adding Entity Idea

1. Client sends POST to `/entities/1/idea`
   ```json
   {
     "idea_text": "Explore the forest",
     "priority": 8
   }
   ```

2. Node.js API validates entity exists
3. Inserts idea into database
4. Returns idea record with ID

## Security

### Authentication
- Admin endpoints protected by Bearer token
- Token configured in `.env` file
- PHP registration uses password hashing (bcrypt)

### Database
- Connection pooling for efficiency
- Parameterized queries prevent SQL injection
- Foreign key constraints maintain referential integrity

## Scalability Considerations

### Current Design
- Single-node deployment
- Synchronous simulation per world
- Direct database writes on each tick

### Future Improvements
- Horizontal scaling: Multiple API servers behind load balancer
- Simulation optimization: Batch database writes, in-memory state
- WebSocket scaling: Redis pub/sub for multi-server broadcasts
- Database: Read replicas for queries, write master for simulation

## Configuration

All configurable via `.env` file:
- Database credentials
- Server ports
- Simulation parameters (tick rate, seed)
- Admin authentication token

## Deployment

### Docker Compose
```bash
docker compose up -d
```

Services start in order:
1. MySQL (with health check)
2. Node.js API (waits for MySQL)
3. PHP Web (waits for MySQL)

### Manual Deployment
1. Set up MySQL database, run `db/init.sql`
2. Configure `.env` with database credentials
3. Install Node.js dependencies: `npm install`
4. Start Node.js server: `npm start`
5. Set up Apache/nginx with PHP for `public/` directory

## Monitoring

### Health Checks
- `GET /health` - API server health
- Docker health checks for MySQL

### Logs
- Docker logs: `docker compose logs -f`
- Application logs: Console output in Node.js
- Database logs: MySQL container logs

### Metrics
- `GET /admin/stats` - Entity, world, event, player counts
- WebSocket connection count
- Database query performance (manual monitoring)
