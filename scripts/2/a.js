/**
 * SYRYS SDK Layer
 * File: 2/a.js
 * Responsibility: Minecraft API Adaptation & Compatibility
 */

import { world, system, players } from '@minecraft/server';

const SDK = {};

SDK.init = function(FWK) {
  FWK.sdk = {
    minecraft: { world, system },
    adapters: new Map(),
    compatibility: {
      scriptAPIVersion: '1.21.0',
      minecraftVersion: '1.21.0',
      supportedFeatures: []
    },
    stats: {
      playerAdapterCalls: 0,
      commandExecutions: 0,
      errors: 0
    }
  };
  
  FWK.components.sdk = SDK;
};

/**
 * Get Player Adapter
 */
SDK.getPlayer = function(playerObj) {
  this.stats.playerAdapterCalls++;
  
  if (!playerObj || !playerObj.isValid()) {
    return null;
  }
  
  return {
    id: playerObj.id,
    name: playerObj.name,
    xuid: playerObj.name, // Placeholder - actual XUID retrieval depends on API availability
    dimension: playerObj.dimension.id,
    location: {
      x: playerObj.location.x,
      y: playerObj.location.y,
      z: playerObj.location.z
    },
    rotation: {
      x: playerObj.getRotation().x,
      y: playerObj.getRotation().y
    },
    valid: playerObj.isValid(),
    isSurvival: playerObj.gameMode === 0,
    isCreative: playerObj.gameMode === 1,
    isAdventure: playerObj.gameMode === 2,
    isSpectator: playerObj.gameMode === 3
  };
};

/**
 * Get World Adapter
 */
SDK.getWorld = function() {
  return {
    players: world.getAllPlayers().length,
    time: world.getAbsoluteTime(),
    dayTime: world.getTime(),
    isRaining: world.isRaining?.() || false,
    isThundering: world.isThundering?.() || false,
    difficulty: world.getDifficulty?.() || 'normal'
  };
};

/**
 * Get Player by Name
 */
SDK.getPlayerByName = function(name) {
  const allPlayers = world.getAllPlayers();
  for (const player of allPlayers) {
    if (player.name === name && player.isValid()) {
      return this.getPlayer(player);
    }
  }
  return null;
};

/**
 * Get All Players
 */
SDK.getAllPlayers = function() {
  const results = [];
  const allPlayers = world.getAllPlayers();
  
  for (const player of allPlayers) {
    if (player.isValid()) {
      results.push(this.getPlayer(player));
    }
  }
  
  return results;
};

/**
 * Execute Command
 */
SDK.executeCommand = function(command, fromPlayer = null) {
  try {
    this.stats.commandExecutions++;
    
    if (fromPlayer) {
      return fromPlayer.runCommand(command);
    } else {
      // Execute from console
      return system.run(() => {
        world.getDimension('overworld').runCommand(command);
      });
    }
  } catch (err) {
    this.stats.errors++;
    console.error('[SDK] Command error:', err);
    return null;
  }
};

/**
 * Send Message to Player
 */
SDK.tellPlayer = function(player, message) {
  try {
    if (typeof player === 'string') {
      player = this.getPlayerByName(player);
      if (!player) return false;
    }
    
    system.run(() => {
      world.sendMessage(`§r${message}`);
    });
    return true;
  } catch (err) {
    console.error('[SDK] Message error:', err);
    return false;
  }
};

/**
 * Send Broadcast Message
 */
SDK.broadcast = function(message) {
  try {
    system.run(() => {
      world.sendMessage(`§e[SYRYS] §r${message}`);
    });
    return true;
  } catch (err) {
    console.error('[SDK] Broadcast error:', err);
    return false;
  }
};

/**
 * Get Player by ID
 */
SDK.getPlayerById = function(id) {
  const allPlayers = world.getAllPlayers();
  for (const player of allPlayers) {
    if (player.id === id && player.isValid()) {
      return this.getPlayer(player);
    }
  }
  return null;
};

/**
 * Give Item to Player
 */
SDK.giveItem = function(player, itemId, amount = 1) {
  try {
    const cmd = `give @s ${itemId} ${amount}`;
    return this.executeCommand(cmd, player);
  } catch (err) {
    this.stats.errors++;
    console.error('[SDK] Give item error:', err);
    return false;
  }
};

/**
 * Get Stats
 */
SDK.getStats = function() {
  return {
    ...this.stats,
    onlinePlayers: world.getAllPlayers().length
  };
};

export { SDK };
