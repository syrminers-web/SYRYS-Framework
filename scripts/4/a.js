/**
 * SYRYS Storage Layer
 * File: 4/a.js
 * Responsibility: Data Persistence and Management
 */

import { world } from '@minecraft/server';

const Storage = {};

const data = new Map();
const snapshots = new Map();
let snapshotId = 0;

Storage.init = function(FWK) {
  FWK.storage = {
    data: data,
    snapshots: snapshots,
    stats: {
      writes: 0,
      reads: 0,
      corruptions: 0,
      snapshotsCreated: 0
    },
    provider: 'DynamicProperties',
    lastBackup: null
  };
  
  FWK.components.storage = Storage;
};

/**
 * Save Data
 */
Storage.save = function(key, value) {
  try {
    const serialized = JSON.stringify({
      data: value,
      version: '1.0.0',
      timestamp: Date.now(),
      checksum: this.checksum(JSON.stringify(value))
    });
    
    data.set(key, serialized);
    this.stats.writes++;
    
    return true;
  } catch (err) {
    console.error('[Storage] Save error:', err);
    this.stats.corruptions++;
    return false;
  }
};

/**
 * Load Data
 */
Storage.load = function(key) {
  try {
    const stored = data.get(key);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    this.stats.reads++;
    
    if (!this.validate(parsed)) {
      this.stats.corruptions++;
      console.warn('[Storage] Data corruption detected:', key);
      return null;
    }
    
    return parsed.data;
  } catch (err) {
    console.error('[Storage] Load error:', err);
    this.stats.corruptions++;
    return null;
  }
};

/**
 * Delete Data
 */
Storage.delete = function(key) {
  return data.delete(key);
};

/**
 * Check if Key Exists
 */
Storage.exists = function(key) {
  return data.has(key);
};

/**
 * Get All Keys
 */
Storage.keys = function() {
  return Array.from(data.keys());
};

/**
 * Create Snapshot
 */
Storage.snapshot = function(key, reason = 'MANUAL') {
  const id = ++snapshotId;
  const current = data.get(key);
  
  if (!current) {
    console.warn('[Storage] Cannot snapshot non-existent key:', key);
    return null;
  }
  
  const snapshot = {
    id,
    key,
    data: current,
    createdAt: Date.now(),
    reason,
    version: '1.0.0'
  };
  
  snapshots.set(id, snapshot);
  this.stats.snapshotsCreated++;
  
  return id;
};

/**
 * Restore Snapshot
 */
Storage.restoreSnapshot = function(snapshotId) {
  const snap = snapshots.get(snapshotId);
  if (!snap) {
    console.warn('[Storage] Snapshot not found:', snapshotId);
    return false;
  }
  
  data.set(snap.key, snap.data);
  return true;
};

/**
 * List Snapshots for Key
 */
Storage.listSnapshots = function(key) {
  const results = [];
  
  for (const [id, snap] of snapshots) {
    if (snap.key === key) {
      results.push({
        id,
        key: snap.key,
        createdAt: snap.createdAt,
        reason: snap.reason
      });
    }
  }
  
  return results.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Delete Snapshot
 */
Storage.deleteSnapshot = function(snapshotId) {
  return snapshots.delete(snapshotId);
};

/**
 * Batch Save
 */
Storage.batchSave = function(items) {
  let successCount = 0;
  let failCount = 0;
  
  for (const [key, value] of Object.entries(items)) {
    if (this.save(key, value)) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  return { success: successCount, failed: failCount };
};

/**
 * Batch Load
 */
Storage.batchLoad = function(keys) {
  const results = {};
  
  for (const key of keys) {
    results[key] = this.load(key);
  }
  
  return results;
};

/**
 * Clear All Data
 */
Storage.clear = function() {
  const size = data.size;
  data.clear();
  return size;
};

/**
 * Calculate Checksum
 */
Storage.checksum = function(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

/**
 * Validate Data
 */
Storage.validate = function(obj) {
  if (!obj || obj.data === undefined || !obj.version || !obj.checksum) {
    return false;
  }
  
  const computedChecksum = this.checksum(JSON.stringify(obj.data));
  return computedChecksum === obj.checksum;
};

/**
 * Get Storage Size
 */
Storage.getSize = function() {
  let totalSize = 0;
  
  for (const [, value] of data) {
    totalSize += value.length;
  }
  
  return {
    totalBytes: totalSize,
    keyCount: data.size,
    snapshotCount: snapshots.size
  };
};

/**
 * Get Stats
 */
Storage.getStats = function() {
  return {
    ...this.stats,
    keys: data.size,
    snapshots: snapshots.size,
    lastBackup: this.lastBackup
  };
};

export { Storage };
