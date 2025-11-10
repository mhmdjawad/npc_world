const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.post('/:id/join', async (req, res) => {
  try {
    const worldId = parseInt(req.params.id);
    const { player_id, entity_id } = req.body;

    if (!player_id || !entity_id) {
      return res.status(400).json({ error: 'player_id and entity_id are required' });
    }

    const [worldRows] = await pool.execute(
      'SELECT * FROM worlds WHERE id = ?',
      [worldId]
    );

    if (worldRows.length === 0) {
      return res.status(404).json({ error: 'World not found' });
    }

    const [entityRows] = await pool.execute(
      'SELECT * FROM entities WHERE id = ? AND world_id = ?',
      [entity_id, worldId]
    );

    if (entityRows.length === 0) {
      return res.status(404).json({ error: 'Entity not found in this world' });
    }

    const [result] = await pool.execute(
      'INSERT INTO assignments (player_id, entity_id, world_id, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE assigned_at = CURRENT_TIMESTAMP',
      [player_id, entity_id, worldId, 'observer']
    );

    res.json({
      success: true,
      message: 'Successfully joined world',
      assignment: {
        player_id,
        entity_id,
        world_id: worldId,
        role: 'observer'
      }
    });
  } catch (error) {
    console.error('Error joining world:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const worldId = parseInt(req.params.id);

    const [worldRows] = await pool.execute(
      'SELECT * FROM worlds WHERE id = ?',
      [worldId]
    );

    if (worldRows.length === 0) {
      return res.status(404).json({ error: 'World not found' });
    }

    const [entities] = await pool.execute(
      'SELECT * FROM entities WHERE world_id = ? AND is_active = TRUE',
      [worldId]
    );

    const world = worldRows[0];
    const worldState = req.app.locals.simulationEngine.getWorldState(worldId);

    res.json({
      ...world,
      entities: worldState ? worldState.entities : entities.map(e => ({
        ...e,
        state: typeof e.state === 'string' ? JSON.parse(e.state) : e.state
      }))
    });
  } catch (error) {
    console.error('Error fetching world:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [worlds] = await pool.execute('SELECT * FROM worlds');
    res.json(worlds);
  } catch (error) {
    console.error('Error fetching worlds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
