const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { adminAuth } = require('../middleware/auth');

router.use(adminAuth);

router.get('/worlds', async (req, res) => {
  try {
    const [worlds] = await pool.execute('SELECT * FROM worlds');
    res.json(worlds);
  } catch (error) {
    console.error('Error fetching worlds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/worlds', async (req, res) => {
  try {
    const { name, seed, tick_rate_ms } = req.body;

    if (!name || !seed) {
      return res.status(400).json({ error: 'name and seed are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO worlds (name, seed, tick_rate_ms) VALUES (?, ?, ?)',
      [name, seed, tick_rate_ms || 1000]
    );

    const worldId = result.insertId;
    await req.app.locals.simulationEngine.initializeWorld(worldId);
    req.app.locals.simulationEngine.startSimulation(worldId, tick_rate_ms || 1000);

    res.json({
      success: true,
      world: {
        id: worldId,
        name,
        seed,
        tick_rate_ms: tick_rate_ms || 1000
      }
    });
  } catch (error) {
    console.error('Error creating world:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/worlds/:id/start', async (req, res) => {
  try {
    const worldId = parseInt(req.params.id);
    const world = req.app.locals.simulationEngine.worlds.get(worldId);

    if (!world) {
      await req.app.locals.simulationEngine.initializeWorld(worldId);
    }

    req.app.locals.simulationEngine.startSimulation(worldId, world?.tick_rate_ms || 1000);

    res.json({ success: true, message: `Simulation started for world ${worldId}` });
  } catch (error) {
    console.error('Error starting simulation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/worlds/:id/stop', async (req, res) => {
  try {
    const worldId = parseInt(req.params.id);
    req.app.locals.simulationEngine.stopSimulation(worldId);

    res.json({ success: true, message: `Simulation stopped for world ${worldId}` });
  } catch (error) {
    console.error('Error stopping simulation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/entities', async (req, res) => {
  try {
    const [entities] = await pool.execute('SELECT * FROM entities');
    res.json(entities.map(e => ({
      ...e,
      state: typeof e.state === 'string' ? JSON.parse(e.state) : e.state
    })));
  } catch (error) {
    console.error('Error fetching entities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/entities', async (req, res) => {
  try {
    const { world_id, entity_type, name, position_x, position_y, position_z, state } = req.body;

    if (!world_id || !name) {
      return res.status(400).json({ error: 'world_id and name are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO entities (world_id, entity_type, name, position_x, position_y, position_z, state) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [world_id, entity_type || 'npc', name, position_x || 0, position_y || 0, position_z || 0, JSON.stringify(state || {})]
    );

    await req.app.locals.simulationEngine.loadEntities(world_id);

    res.json({
      success: true,
      entity: {
        id: result.insertId,
        world_id,
        entity_type: entity_type || 'npc',
        name,
        position_x: position_x || 0,
        position_y: position_y || 0,
        position_z: position_z || 0,
        state: state || {}
      }
    });
  } catch (error) {
    console.error('Error creating entity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const { world_id, entity_id, limit } = req.query;
    let query = 'SELECT * FROM events';
    let params = [];

    if (world_id) {
      query += ' WHERE world_id = ?';
      params.push(parseInt(world_id));
    }

    if (entity_id) {
      query += world_id ? ' AND entity_id = ?' : ' WHERE entity_id = ?';
      params.push(parseInt(entity_id));
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit) || 100);

    const [events] = await pool.execute(query, params);
    res.json(events.map(e => ({
      ...e,
      event_data: typeof e.event_data === 'string' ? JSON.parse(e.event_data) : e.event_data
    })));
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [worldCount] = await pool.execute('SELECT COUNT(*) as count FROM worlds');
    const [entityCount] = await pool.execute('SELECT COUNT(*) as count FROM entities');
    const [eventCount] = await pool.execute('SELECT COUNT(*) as count FROM events');
    const [playerCount] = await pool.execute('SELECT COUNT(*) as count FROM players');

    res.json({
      worlds: worldCount[0].count,
      entities: entityCount[0].count,
      events: eventCount[0].count,
      players: playerCount[0].count
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
