/**
 * SYRYS Central Registry
 * File: 1/c.js
 * Responsibility: Central Component Registry & Discovery
 */

const Reg = {};

Reg.init = function(FWK) {
  FWK.registry = {
    services: new Map(),
    events: new Map(),
    modules: new Map(),
    adapters: new Map(),
    configurations: new Map(),
    stats: {
      registered: 0,
      queries: 0
    }
  };
  
  FWK.components.registry = Reg;
};

/**
 * Register Service
 */
Reg.registerService = function(id, service) {
  const entry = {
    id,
    service,
    version: service.version || '1.0.0',
    registeredAt: Date.now(),
    type: 'SERVICE'
  };
  
  this.services.set(id, entry);
  this.stats.registered++;
  return id;
};

/**
 * Register Event Type
 */
Reg.registerEvent = function(eventName, schema) {
  const entry = {
    name: eventName,
    schema,
    listeners: [],
    emitted: 0,
    type: 'EVENT'
  };
  
  this.events.set(eventName, entry);
  this.stats.registered++;
  return eventName;
};

/**
 * Register Module
 */
Reg.registerModule = function(id, module) {
  const entry = {
    id,
    module,
    version: module.version || '1.0.0',
    registeredAt: Date.now(),
    type: 'MODULE',
    dependencies: module.dependencies || []
  };
  
  this.modules.set(id, entry);
  this.stats.registered++;
  return id;
};

/**
 * Register Adapter
 */
Reg.registerAdapter = function(id, adapter) {
  const entry = {
    id,
    adapter,
    version: adapter.version || '1.0.0',
    type: 'ADAPTER'
  };
  
  this.adapters.set(id, entry);
  return id;
};

/**
 * Get Service
 */
Reg.getService = function(id) {
  this.stats.queries++;
  const entry = this.services.get(id);
  return entry?.service || null;
};

/**
 * Get Module
 */
Reg.getModule = function(id) {
  this.stats.queries++;
  const entry = this.modules.get(id);
  return entry?.module || null;
};

/**
 * Get Adapter
 */
Reg.getAdapter = function(id) {
  this.stats.queries++;
  const entry = this.adapters.get(id);
  return entry?.adapter || null;
};

/**
 * List All Services
 */
Reg.listServices = function() {
  return Array.from(this.services.keys());
};

/**
 * List All Events
 */
Reg.listEvents = function() {
  return Array.from(this.events.keys());
};

/**
 * List All Modules
 */
Reg.listModules = function() {
  return Array.from(this.modules.keys());
};

/**
 * Get Registry Status
 */
Reg.getStatus = function() {
  return {
    services: this.services.size,
    events: this.events.size,
    modules: this.modules.size,
    adapters: this.adapters.size,
    stats: this.stats
  };
};

export { Reg };
