const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/:id', async (req, res) => {
  try {
    const entityId = parseInt(req.params.id);

    const worldState = req.app.locals.simulationEngine.worlds;
    let entity = null;

    for (const [worldId, world] of worldState) {
      const e = world.entities.get(entityId);
      if (e) {
        entity = e;
        break;
      }
    }

    if (!entity) {
      const [entityRows] = await pool.execute(
        'SELECT * FROM entities WHERE id = ?',
        [entityId]
      );

      if (entityRows.length === 0) {
        return res.status(404).json({ error: 'Entity not found' });
      }

      entity = entityRows[0];
      entity.state = typeof entity.state === 'string' ? JSON.parse(entity.state) : entity.state;
    }

    const [ideas] = await pool.execute(
      'SELECT * FROM ideas WHERE entity_id = ? ORDER BY created_at DESC LIMIT 10',
      [entityId]
    );

    res.json({
      ...entity,
      ideas
    });
  } catch (error) {
    console.error('Error fetching entity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/idea', async (req, res) => {
  try {
    const entityId = parseInt(req.params.id);
    const { idea_text, priority } = req.body;

    if (!idea_text) {
      return res.status(400).json({ error: 'idea_text is required' });
    }

    const [entityRows] = await pool.execute(
      'SELECT * FROM entities WHERE id = ?',
      [entityId]
    );

    if (entityRows.length === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const entity = entityRows[0];

    const [result] = await pool.execute(
      'INSERT INTO ideas (entity_id, world_id, idea_text, priority) VALUES (?, ?, ?, ?)',
      [entityId, entity.world_id, idea_text, priority || 5]
    );

    res.json({
      success: true,
      idea: {
        id: result.insertId,
        entity_id: entityId,
        world_id: entity.world_id,
        idea_text,
        priority: priority || 5,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error creating idea:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
