const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { testConnection } = require('./db');
const SimulationEngine = require('./simulation/engine');
const worldsRouter = require('./routes/worlds');
const entitiesRouter = require('./routes/entities');
const adminRouter = require('./routes/admin');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const simulationEngine = new SimulationEngine();
app.locals.simulationEngine = simulationEngine;

app.use('/worlds', worldsRouter);
app.use('/entities', entitiesRouter);
app.use('/admin', adminRouter);

app.get('/', (req, res) => {
  res.json({
    name: 'NPC World API',
    version: '1.0.0',
    endpoints: {
      worlds: {
        'GET /worlds': 'List all worlds',
        'GET /worlds/:id': 'Get world details',
        'POST /worlds/:id/join': 'Join a world'
      },
      entities: {
        'GET /entities/:id': 'Get entity details',
        'POST /entities/:id/idea': 'Add idea to entity'
      },
      admin: {
        'GET /admin/worlds': 'List all worlds (admin)',
        'POST /admin/worlds': 'Create new world',
        'POST /admin/worlds/:id/start': 'Start simulation',
        'POST /admin/worlds/:id/stop': 'Stop simulation',
        'GET /admin/entities': 'List all entities',
        'POST /admin/entities': 'Create new entity',
        'GET /admin/events': 'List events',
        'GET /admin/stats': 'Get statistics'
      },
      websocket: {
        'WS /ws': 'WebSocket connection for real-time updates'
      }
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const API_PORT = process.env.API_PORT || 3000;

const wss = new WebSocket.Server({ server, path: '/ws' });

const clients = new Map();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.action === 'subscribe' && data.entity_id) {
        clients.set(ws, { entity_id: data.entity_id });
        ws.send(JSON.stringify({
          type: 'subscribed',
          entity_id: data.entity_id,
          message: `Subscribed to entity ${data.entity_id}`
        }));
        console.log(`Client subscribed to entity ${data.entity_id}`);
      } else if (data.action === 'unsubscribe') {
        clients.delete(ws);
        ws.send(JSON.stringify({
          type: 'unsubscribed',
          message: 'Unsubscribed from all entities'
        }));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket connection closed');
  });

  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to NPC World WebSocket server',
    instructions: 'Send {"action": "subscribe", "entity_id": <id>} to subscribe to entity updates'
  }));
});

function broadcastEntityUpdate(entityId, entityData) {
  const message = JSON.stringify({
    type: 'entity_update',
    entity_id: entityId,
    data: entityData,
    timestamp: new Date().toISOString()
  });

  clients.forEach((clientData, ws) => {
    if (clientData.entity_id === entityId && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

setInterval(() => {
  simulationEngine.worlds.forEach((world, worldId) => {
    world.entities.forEach((entity, entityId) => {
      if (Math.random() < 0.05) {
        broadcastEntityUpdate(entityId, entity);
      }
    });
  });
}, 5000);

async function startServer() {
  console.log('Starting NPC World Server...\n');

  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  await simulationEngine.initializeWorld(1);
  simulationEngine.startSimulation(1, parseInt(process.env.TICK_RATE_MS) || 1000);

  server.listen(API_PORT, () => {
    console.log(`\n✓ REST API server running on port ${API_PORT}`);
    console.log(`✓ WebSocket server running on ws://localhost:${API_PORT}/ws`);
    console.log(`\nAPI Documentation: http://localhost:${API_PORT}/`);
    console.log('\nReady to accept connections!\n');
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
