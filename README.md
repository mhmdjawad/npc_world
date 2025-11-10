# 🌍 NPC World

A deterministic tick-based simulation system with REST API, WebSocket support, and persistent storage. Built with Node.js, MySQL, PHP, and Docker Compose.

## Features

- **Deterministic Simulation**: Tick-based world simulation using seeded PRNG (seedrandom)
- **Real-time Updates**: WebSocket server for entity state subscriptions
- **REST API**: Comprehensive endpoints for world, entity, and admin operations
- **MySQL Database**: Persistent storage with relational schema
- **PHP Registration**: Web-based player registration system
- **Docker Compose**: Complete containerized deployment
- **Admin Panel**: Protected admin endpoints for world management
- **Idea System**: NPCs can have goals, intentions, and ideas

## Architecture

### Database Schema

The system uses MySQL with the following tables:

- **worlds**: Simulation worlds with their own seeds and tick rates
- **entities**: NPCs and objects within worlds
- **events**: Event log for simulation history
- **players**: Human players who can observe/control entities
- **assignments**: Links players to entities
- **ideas**: Goals and intentions for entities

### Components

1. **Node.js API Server** (Port 3000)
   - REST API endpoints
   - WebSocket server (ws://localhost:3000/ws)
   - Simulation engine with deterministic PRNG
   
2. **PHP Web Server** (Port 8080)
   - Player registration page
   - Static client pages
   
3. **MySQL Database** (Port 3306)
   - Persistent data storage
   - Initialized with test data

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mhmdjawad/npc_world.git
cd npc_world
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Start all services:
```bash
docker-compose up -d
```

4. Wait for services to initialize (about 30 seconds), then access:
   - **Web Home**: http://localhost:8080/
   - **Registration**: http://localhost:8080/register.php
   - **WebSocket Client**: http://localhost:8080/client.html
   - **REST API**: http://localhost:3000/
   - **WebSocket**: ws://localhost:3000/ws

### Development Setup (Without Docker)

1. Install Node.js dependencies:
```bash
npm install
```

2. Set up MySQL database:
```bash
mysql -u root -p < db/init.sql
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Start the Node.js server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

## API Documentation

### Public Endpoints

#### GET /
Returns API documentation and available endpoints.

#### GET /health
Health check endpoint.

#### GET /worlds
List all simulation worlds.

```bash
curl http://localhost:3000/worlds
```

#### GET /worlds/:id
Get details of a specific world including all entities.

```bash
curl http://localhost:3000/worlds/1
```

#### POST /worlds/:id/join
Join a world as a player.

```bash
curl -X POST http://localhost:3000/worlds/1/join \
  -H "Content-Type: application/json" \
  -d '{"player_id": 1, "entity_id": 1}'
```

#### GET /entities/:id
Get details of a specific entity including recent ideas.

```bash
curl http://localhost:3000/entities/1
```

#### POST /entities/:id/idea
Add an idea/goal to an entity.

```bash
curl -X POST http://localhost:3000/entities/1/idea \
  -H "Content-Type: application/json" \
  -d '{"idea_text": "Explore the northern region", "priority": 8}'
```

### Admin Endpoints

All admin endpoints require authentication via Bearer token:

```bash
Authorization: Bearer your_secure_admin_token_here
```

#### GET /admin/worlds
List all worlds (admin view).

#### POST /admin/worlds
Create a new world.

```bash
curl -X POST http://localhost:3000/admin/worlds \
  -H "Authorization: Bearer your_secure_admin_token_here" \
  -H "Content-Type: application/json" \
  -d '{"name": "New World", "seed": "67890", "tick_rate_ms": 2000}'
```

#### POST /admin/worlds/:id/start
Start simulation for a world.

```bash
curl -X POST http://localhost:3000/admin/worlds/1/start \
  -H "Authorization: Bearer your_secure_admin_token_here"
```

#### POST /admin/worlds/:id/stop
Stop simulation for a world.

```bash
curl -X POST http://localhost:3000/admin/worlds/1/stop \
  -H "Authorization: Bearer your_secure_admin_token_here"
```

#### GET /admin/entities
List all entities.

#### POST /admin/entities
Create a new entity.

```bash
curl -X POST http://localhost:3000/admin/entities \
  -H "Authorization: Bearer your_secure_admin_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "world_id": 1,
    "entity_type": "npc",
    "name": "Diana",
    "position_x": 15,
    "position_y": 20,
    "state": {"mood": "happy", "occupation": "trader"}
  }'
```

#### GET /admin/events
List simulation events with optional filters.

```bash
# Get events for a specific world
curl "http://localhost:3000/admin/events?world_id=1&limit=50" \
  -H "Authorization: Bearer your_secure_admin_token_here"

# Get events for a specific entity
curl "http://localhost:3000/admin/events?entity_id=1&limit=50" \
  -H "Authorization: Bearer your_secure_admin_token_here"
```

#### GET /admin/stats
Get system statistics.

```bash
curl http://localhost:3000/admin/stats \
  -H "Authorization: Bearer your_secure_admin_token_here"
```

## WebSocket Usage

### Connection

Connect to the WebSocket server:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('Connected to NPC World');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Subscribe to Entity Updates

```javascript
// Subscribe to entity ID 1
ws.send(JSON.stringify({
  action: 'subscribe',
  entity_id: 1
}));

// You will now receive real-time updates for entity 1
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'entity_update') {
    console.log('Entity update:', message.data);
  }
};
```

### Unsubscribe

```javascript
ws.send(JSON.stringify({
  action: 'unsubscribe'
}));
```

## Configuration

### Environment Variables

Edit `.env` to configure the system:

```env
# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_USER=npcworld
DB_PASSWORD=npcworld_password
DB_NAME=npcworld

# Server Configuration
NODE_ENV=development
API_PORT=3000
WS_PORT=3001

# Simulation Configuration
TICK_RATE_MS=1000        # Milliseconds between ticks
WORLD_SEED=12345         # Default world seed for determinism

# Admin Configuration
ADMIN_TOKEN=your_secure_admin_token_here
```

### Tick Rate

The simulation runs on a configurable tick rate (default: 1000ms). Each tick:
1. Updates all entity positions using deterministic PRNG
2. Modifies entity energy levels
3. Logs events to the database
4. Broadcasts updates to subscribed WebSocket clients

### Determinism

The simulation uses a seeded PRNG (`seedrandom`) to ensure reproducibility:
- Same seed + same tick = same results
- Each world has its own seed
- Entity behaviors are deterministic based on the seed

## Project Structure

```
npc_world/
├── db/
│   └── init.sql              # MySQL schema and initial data
├── public/
│   ├── index.html           # Home page
│   ├── register.php         # Player registration
│   └── client.html          # WebSocket client
├── src/
│   ├── server.js            # Main server entry point
│   ├── db.js                # Database connection pool
│   ├── middleware/
│   │   └── auth.js          # Admin authentication
│   ├── routes/
│   │   ├── admin.js         # Admin endpoints
│   │   ├── entities.js      # Entity endpoints
│   │   └── worlds.js        # World endpoints
│   └── simulation/
│       └── engine.js        # Simulation engine with PRNG
├── docker-compose.yml       # Docker services configuration
├── Dockerfile.node          # Node.js service Dockerfile
├── Dockerfile.php           # PHP service Dockerfile
├── package.json             # Node.js dependencies
├── .env.example             # Environment template
├── .gitignore              # Git ignore rules
├── LICENSE                 # MIT License
└── README.md              # This file
```

## Simulation Engine

The simulation engine (`src/simulation/engine.js`) provides:

- **World Initialization**: Load worlds with their seeds and entities
- **Tick System**: Regular updates at configurable intervals
- **Deterministic Updates**: Seeded random number generation
- **Entity Management**: Dynamic entity loading and state tracking
- **Event Logging**: Persistent event history
- **State Access**: Query current simulation state

### Key Methods

```javascript
// Initialize a world
await engine.initializeWorld(worldId);

// Start simulation
engine.startSimulation(worldId, tickRateMs);

// Stop simulation
engine.stopSimulation(worldId);

// Get current state
const state = engine.getWorldState(worldId);
const entity = engine.getEntityState(worldId, entityId);
```

## Testing

### Test the API

```bash
# Get all worlds
curl http://localhost:3000/worlds

# Get world 1 details
curl http://localhost:3000/worlds/1

# Get entity 1 details
curl http://localhost:3000/entities/1

# Add idea to entity 1
curl -X POST http://localhost:3000/entities/1/idea \
  -H "Content-Type: application/json" \
  -d '{"idea_text": "Find food", "priority": 9}'
```

### Test WebSocket Connection

Use the included WebSocket client at http://localhost:8080/client.html or test with a tool like `wscat`:

```bash
npm install -g wscat
wscat -c ws://localhost:3000/ws

# After connection, subscribe to entity 1:
> {"action": "subscribe", "entity_id": 1}
```

### Test Determinism

Run the simulation multiple times with the same seed to verify deterministic behavior:

```bash
# Create two worlds with the same seed
curl -X POST http://localhost:3000/admin/worlds \
  -H "Authorization: Bearer your_secure_admin_token_here" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test World 1", "seed": "test123", "tick_rate_ms": 1000}'

curl -X POST http://localhost:3000/admin/worlds \
  -H "Authorization: Bearer your_secure_admin_token_here" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test World 2", "seed": "test123", "tick_rate_ms": 1000}'

# After a few seconds, compare the entity states - they should be identical
```

## Troubleshooting

### Database Connection Issues

If the Node.js service can't connect to MySQL:
1. Wait for MySQL to fully initialize (check logs: `docker-compose logs mysql`)
2. Verify database credentials in `.env`
3. Restart the Node.js service: `docker-compose restart nodejs_api`

### WebSocket Connection Fails

1. Ensure the Node.js service is running: `docker-compose ps`
2. Check that port 3000 is not in use: `netstat -an | grep 3000`
3. Try connecting to `ws://localhost:3000/ws` directly

### Simulation Not Running

1. Check that the world is started: `GET /admin/worlds`
2. Manually start simulation: `POST /admin/worlds/:id/start`
3. Check server logs: `docker-compose logs nodejs_api`

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the GitHub repository.