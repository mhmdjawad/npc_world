const seedrandom = require('seedrandom');
const { pool } = require('../db');

class SimulationEngine {
  constructor() {
    this.worlds = new Map();
    this.tickIntervals = new Map();
  }

  async initializeWorld(worldId) {
    try {
      const [worldRows] = await pool.execute(
        'SELECT * FROM worlds WHERE id = ?',
        [worldId]
      );

      if (worldRows.length === 0) {
        throw new Error(`World ${worldId} not found`);
      }

      const world = worldRows[0];
      const rng = seedrandom(world.seed);

      this.worlds.set(worldId, {
        ...world,
        rng,
        entities: new Map()
      });

      await this.loadEntities(worldId);

      console.log(`✓ World ${worldId} initialized with seed: ${world.seed}`);
      return world;
    } catch (error) {
      console.error(`Error initializing world ${worldId}:`, error);
      throw error;
    }
  }

  async loadEntities(worldId) {
    try {
      const [entities] = await pool.execute(
        'SELECT * FROM entities WHERE world_id = ? AND is_active = TRUE',
        [worldId]
      );

      const world = this.worlds.get(worldId);
      if (!world) return;

      entities.forEach(entity => {
        world.entities.set(entity.id, {
          ...entity,
          state: typeof entity.state === 'string' ? JSON.parse(entity.state) : entity.state
        });
      });

      console.log(`✓ Loaded ${entities.length} entities for world ${worldId}`);
    } catch (error) {
      console.error(`Error loading entities for world ${worldId}:`, error);
      throw error;
    }
  }

  startSimulation(worldId, tickRateMs = 1000) {
    if (this.tickIntervals.has(worldId)) {
      console.log(`Simulation already running for world ${worldId}`);
      return;
    }

    const interval = setInterval(() => {
      this.tick(worldId);
    }, tickRateMs);

    this.tickIntervals.set(worldId, interval);
    console.log(`✓ Started simulation for world ${worldId} (tick rate: ${tickRateMs}ms)`);
  }

  stopSimulation(worldId) {
    const interval = this.tickIntervals.get(worldId);
    if (interval) {
      clearInterval(interval);
      this.tickIntervals.delete(worldId);
      console.log(`✓ Stopped simulation for world ${worldId}`);
    }
  }

  async tick(worldId) {
    const world = this.worlds.get(worldId);
    if (!world) return;

    try {
      const currentTick = world.current_tick + 1;

      for (const [entityId, entity] of world.entities) {
        await this.updateEntity(worldId, entityId, entity, world.rng, currentTick);
      }

      await pool.execute(
        'UPDATE worlds SET current_tick = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [currentTick, worldId]
      );

      world.current_tick = currentTick;

      if (currentTick % 10 === 0) {
        console.log(`World ${worldId} - Tick ${currentTick}`);
      }
    } catch (error) {
      console.error(`Error during tick for world ${worldId}:`, error);
    }
  }

  async updateEntity(worldId, entityId, entity, rng, tickNumber) {
    const deltaX = (rng() - 0.5) * 2;
    const deltaY = (rng() - 0.5) * 2;

    const newX = entity.position_x + deltaX;
    const newY = entity.position_y + deltaY;

    const energyChange = Math.floor((rng() - 0.5) * 10);
    const newEnergy = Math.max(0, Math.min(100, entity.energy + energyChange));

    try {
      await pool.execute(
        'UPDATE entities SET position_x = ?, position_y = ?, energy = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newX, newY, newEnergy, entityId]
      );

      entity.position_x = newX;
      entity.position_y = newY;
      entity.energy = newEnergy;

      if (Math.random() < 0.1) {
        await pool.execute(
          'INSERT INTO events (world_id, entity_id, event_type, tick_number, event_data) VALUES (?, ?, ?, ?, ?)',
          [worldId, entityId, 'movement', tickNumber, JSON.stringify({ x: newX, y: newY, energy: newEnergy })]
        );
      }
    } catch (error) {
      console.error(`Error updating entity ${entityId}:`, error);
    }
  }

  getWorldState(worldId) {
    const world = this.worlds.get(worldId);
    if (!world) return null;

    return {
      id: worldId,
      name: world.name,
      current_tick: world.current_tick,
      tick_rate_ms: world.tick_rate_ms,
      entities: Array.from(world.entities.values())
    };
  }

  getEntityState(worldId, entityId) {
    const world = this.worlds.get(worldId);
    if (!world) return null;

    return world.entities.get(entityId);
  }
}

module.exports = SimulationEngine;
