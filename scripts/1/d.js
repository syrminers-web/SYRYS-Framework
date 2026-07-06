/**
 * SYRYS Event Bus
 * File: 1/d.js
 * Responsibility: Central Event Distribution & Management
 */

const Evt = {};

const listeners = new Map();
const eventLog = [];
let eventIdCounter = 0;

Evt.init = function(FWK) {
  FWK.eventBus = {
    listeners: listeners,
    eventLog: eventLog,
    stats: {
      emitted: 0,
      processed: 0,
      errors: 0,
      peakListeners: 0
    }
  };
  
  FWK.components.eventBus = Evt;
};

/**
 * Subscribe to Event
 */
Evt.on = function(eventName, callback, priority = 0) {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, []);
  }
  
  const listenerId = ++eventIdCounter;
  const listener = {
    callback,
    priority,
    id: listenerId,
    subscribedAt: Date.now(),
    called: 0,
    errors: 0
  };
  
  listeners.get(eventName).push(listener);
  
  // Sort by priority (highest first)
  listeners.get(eventName).sort((a, b) => b.priority - a.priority);
  
  // Update peak listeners stat
  const count = listeners.get(eventName).length;
  if (count > this.stats.peakListeners) {
    this.stats.peakListeners = count;
  }
  
  return listenerId;
};

/**
 * Unsubscribe from Event
 */
Evt.off = function(eventName, listenerId) {
  if (!listeners.has(eventName)) return false;
  
  const list = listeners.get(eventName);
  const idx = list.findIndex(l => l.id === listenerId);
  
  if (idx !== -1) {
    list.splice(idx, 1);
    return true;
  }
  return false;
};

/**
 * Emit Event
 */
Evt.emit = function(eventName, data = {}) {
  const eventId = ++eventIdCounter;
  const entry = {
    id: eventId,
    name: eventName,
    data,
    timestamp: Date.now(),
    processed: 0,
    errors: 0,
    cancelled: false
  };
  
  eventLog.push(entry);
  this.stats.emitted++;
  
  if (listeners.has(eventName)) {
    for (const listener of listeners.get(eventName)) {
      try {
        listener.callback(data, entry);
        listener.called++;
        entry.processed++;
        this.stats.processed++;
      } catch (err) {
        listener.errors++;
        entry.errors++;
        this.stats.errors++;
        console.error(`[EventBus] Listener error for ${eventName}:`, err);
      }
    }
  }
  
  return eventId;
};

/**
 * Cancel Event (prevents further propagation)
 */
Evt.cancel = function(eventId) {
  const entry = eventLog.find(e => e.id === eventId);
  if (entry) {
    entry.cancelled = true;
    return true;
  }
  return false;
};

/**
 * Get Event Log
 */
Evt.getLog = function(limit = 100) {
  return eventLog.slice(-limit);
};

/**
 * Query Events
 */
Evt.query = function(filters = {}) {
  return eventLog.filter(entry => {
    if (filters.name && entry.name !== filters.name) return false;
    if (filters.afterTime && entry.timestamp < filters.afterTime) return false;
    if (filters.beforeTime && entry.timestamp > filters.beforeTime) return false;
    if (filters.hasErrors && entry.errors === 0) return false;
    return true;
  });
};

/**
 * Get Listener Count
 */
Evt.getListenerCount = function(eventName) {
  if (!listeners.has(eventName)) return 0;
  return listeners.get(eventName).length;
};

/**
 * Clear Old Logs
 */
Evt.clearOldLogs = function(ageMs = 3600000) {
  const cutoff = Date.now() - ageMs;
  const before = eventLog.length;
  
  eventLog.splice(0, eventLog.findIndex(e => e.timestamp > cutoff));
  
  return before - eventLog.length;
};

/**
 * Get Stats
 */
Evt.getStats = function() {
  return {
    ...this.stats,
    logSize: eventLog.length,
    eventTypes: listeners.size
  };
};

export { Evt };
