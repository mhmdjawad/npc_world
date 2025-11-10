# NPC World - Quick Reference

## Quick Start
```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Start all services
docker compose up -d

# 3. Wait for initialization (30 seconds)
sleep 30

# 4. Access web interface
open http://localhost:8080/
```

Or use the helper script:
```bash
./start.sh
```

## Access Points
| Service | URL | Description |
|---------|-----|-------------|
| Web Home | http://localhost:8080/ | Landing page |
| Registration | http://localhost:8080/register.php | Player registration |
| WebSocket Client | http://localhost:8080/client.html | Real-time client |
| REST API | http://localhost:3000/ | API documentation |
| WebSocket | ws://localhost:3000/ws | WebSocket endpoint |

## Docker Commands
```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f nodejs_api
docker compose logs -f mysql
docker compose logs -f php_web

# Check service status
docker compose ps

# Execute command in container
docker compose exec nodejs_api sh
docker compose exec mysql mysql -u npcworld -p

# Rebuild containers
docker compose build
docker compose up -d --force-recreate
```

## REST API Examples

### Public Endpoints

```bash
# Get API documentation
curl http://localhost:3000/

# Health check
curl http://localhost:3000/health

# List all worlds
curl http://localhost:3000/worlds

# Get world 1
curl http://localhost:3000/worlds/1

# Join world 1
curl -X POST http://localhost:3000/worlds/1/join \
  -H "Content-Type: application/json" \
  -d '{"player_id": 1, "entity_id": 1}'

# Get entity 1
curl http://localhost:3000/entities/1

# Add idea to entity 1
curl -X POST http://localhost:3000/entities/1/idea \
  -H "Content-Type: application/json" \
  -d '{"idea_text": "Explore the forest", "priority": 8}'
```

### Admin Endpoints

**Note:** Replace `your_secure_admin_token_here` with your actual token from `.env`

```bash
# List all worlds
curl http://localhost:3000/admin/worlds \
  -H "Authorization: Bearer your_secure_admin_token_here"

# Create new world
curl -X POST http://localhost:3000/admin/worlds \
  -H "Authorization: Bearer your_secure_admin_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test World",
    "seed": "test123",
    "tick_rate_ms": 2000
  }'

# Start simulation for world 1
curl -X POST http://localhost:3000/admin/worlds/1/start \
  -H "Authorization: Bearer your_secure_admin_token_here"

# Stop simulation for world 1
curl -X POST http://localhost:3000/admin/worlds/1/stop \
  -H "Authorization: Bearer your_secure_admin_token_here"

# List all entities
curl http://localhost:3000/admin/entities \
  -H "Authorization: Bearer your_secure_admin_token_here"

# Create new entity
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

# List recent events
curl "http://localhost:3000/admin/events?limit=20" \
  -H "Authorization: Bearer your_secure_admin_token_here"

# List events for world 1
curl "http://localhost:3000/admin/events?world_id=1&limit=50" \
  -H "Authorization: Bearer your_secure_admin_token_here"

# Get system statistics
curl http://localhost:3000/admin/stats \
  -H "Authorization: Bearer your_secure_admin_token_here"
```

## WebSocket Examples

### JavaScript
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('Connected');
  
  // Subscribe to entity 1
  ws.send(JSON.stringify({
    action: 'subscribe',
    entity_id: 1
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
  
  if (data.type === 'entity_update') {
    console.log('Entity', data.entity_id, 'updated:', data.data);
  }
};

// Unsubscribe
ws.send(JSON.stringify({ action: 'unsubscribe' }));

// Close connection
ws.close();
```

### Using wscat
```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:3000/ws

# Subscribe to entity 1
> {"action": "subscribe", "entity_id": 1}

# Unsubscribe
> {"action": "unsubscribe"}
```

## Database Access

```bash
# Access MySQL shell
docker compose exec mysql mysql -u npcworld -p
# Password: npcworld_password

# Or as root
docker compose exec mysql mysql -u root -p
# Password: root_password

# Common queries
USE npcworld;

SELECT * FROM worlds;
SELECT * FROM entities WHERE world_id = 1;
SELECT * FROM events ORDER BY created_at DESC LIMIT 10;
SELECT * FROM players;
SELECT * FROM ideas WHERE entity_id = 1;
```

## Configuration

### Environment Variables (.env)
```bash
# Database
DB_HOST=mysql
DB_PORT=3306
DB_USER=npcworld
DB_PASSWORD=npcworld_password
DB_NAME=npcworld

# Server
NODE_ENV=development
API_PORT=3000
WS_PORT=3001

# Simulation
TICK_RATE_MS=1000      # Tick interval in milliseconds
WORLD_SEED=12345       # Default seed for determinism

# Admin
ADMIN_TOKEN=your_secure_admin_token_here
```

## Testing

### Run API test suite
```bash
./test-api.sh
```

### Test determinism
```bash
# Create two worlds with same seed
curl -X POST http://localhost:3000/admin/worlds \
  -H "Authorization: Bearer your_secure_admin_token_here" \
  -H "Content-Type: application/json" \
  -d '{"name": "World A", "seed": "same_seed", "tick_rate_ms": 1000}'

curl -X POST http://localhost:3000/admin/worlds \
  -H "Authorization: Bearer your_secure_admin_token_here" \
  -H "Content-Type: application/json" \
  -d '{"name": "World B", "seed": "same_seed", "tick_rate_ms": 1000}'

# Wait a few seconds, then compare entity states
# They should be identical if starting from the same initial state
```

## Troubleshooting

### Services won't start
```bash
# Check Docker
docker --version
docker compose version

# Check logs
docker compose logs mysql
docker compose logs nodejs_api
docker compose logs php_web

# Restart services
docker compose restart
```

### Database connection failed
```bash
# Wait for MySQL to initialize
docker compose logs mysql | grep "ready for connections"

# Check MySQL health
docker compose exec mysql mysqladmin -u root -p ping

# Restart Node.js service after MySQL is ready
docker compose restart nodejs_api
```

### Can't connect to WebSocket
```bash
# Check if Node.js server is running
curl http://localhost:3000/health

# Check port availability
netstat -an | grep 3000

# View Node.js logs
docker compose logs nodejs_api
```

### Port conflicts
```bash
# Check what's using ports
sudo lsof -i :3000  # Node.js API
sudo lsof -i :3306  # MySQL
sudo lsof -i :8080  # PHP Web

# Kill process or change ports in docker-compose.yml
```

## Development

### Local development (without Docker)
```bash
# Install dependencies
npm install

# Set up database manually
mysql -u root -p < db/init.sql

# Configure .env for local database
DB_HOST=localhost
DB_PORT=3306

# Start Node.js server
npm start

# Or with auto-reload
npm run dev

# Serve PHP files with built-in server
cd public
php -S localhost:8080
```

### Add new dependencies
```bash
# Install package
npm install package-name

# Rebuild Docker image
docker compose build nodejs_api
docker compose up -d nodejs_api
```

## File Structure Quick Reference
```
npc_world/
├── src/
│   ├── server.js              # Main server entry
│   ├── db.js                  # Database connection
│   ├── routes/                # API endpoints
│   │   ├── worlds.js         # World endpoints
│   │   ├── entities.js       # Entity endpoints
│   │   └── admin.js          # Admin endpoints
│   ├── simulation/
│   │   └── engine.js         # Simulation engine
│   └── middleware/
│       └── auth.js           # Authentication
├── public/
│   ├── index.html            # Home page
│   ├── register.php          # Registration
│   └── client.html           # WebSocket client
├── db/
│   └── init.sql              # Database schema
├── docker-compose.yml        # Docker configuration
├── package.json              # Node.js dependencies
└── .env                      # Configuration
```

## Useful Links
- [Express.js Docs](https://expressjs.com/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [MySQL Reference](https://dev.mysql.com/doc/)
- [Docker Compose](https://docs.docker.com/compose/)
- [seedrandom](https://github.com/davidbau/seedrandom)
