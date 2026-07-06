/**
 * SYRYS Kernel Core Operations
 * File: 1/b.js
 * Responsibility: Core Kernel Operations & Service Management
 */

const K = {};

/**
 * Initialize Kernel
 */
K.init = function(FWK) {
  FWK.kernel = {
    services: new Map(),
    modules: new Map(),
    lifecycle: 'INITIALIZING',
    errors: [],
    diagnostics: {
      startTime: Date.now(),
      initTime: 0,
      ticksProcessed: 0,
      memoryEstimate: 0
    },
    state: 'BOOTING'
  };
  
  FWK.components.kernel = K;
};

/**
 * Register Service
 */
K.registerService = function(name, service) {
  if (!this.services) this.services = new Map();
  
  const entry = {
    name,
    service,
    version: service.version || '1.0.0',
    status: 'READY',
    registeredAt: Date.now(),
    calls: 0,
    errors: 0
  };
  
  this.services.set(name, entry);
  return true;
};

/**
 * Get Service
 */
K.getService = function(name) {
  const entry = this.services?.get(name);
  if (entry) {
    entry.calls++;
    return entry.service;
  }
  return null;
};

/**
 * Register Module
 */
K.registerModule = function(name, module) {
  if (!this.modules) this.modules = new Map();
  
  const entry = {
    name,
    module,
    version: module.version || '1.0.0',
    status: 'REGISTERED',
    dependencies: module.dependencies || [],
    registeredAt: Date.now()
  };
  
  this.modules.set(name, entry);
  return true;
};

/**
 * Get Module
 */
K.getModule = function(name) {
  return this.modules?.get(name)?.module || null;
};

/**
 * Validate Dependencies
 */
K.validateDependencies = function(module) {
  if (!module.dependencies) return true;
  
  for (const dep of module.dependencies) {
    if (!this.modules.has(dep)) {
      return false;
    }
  }
  return true;
};

/**
 * Record Error
 */
K.recordError = function(component, error, severity = 'ERROR') {
  const entry = {
    component,
    error: error.message || String(error),
    severity,
    timestamp: Date.now(),
    stack: error.stack || ''
  };
  
  this.errors.push(entry);
  
  if (severity === 'CRITICAL' && this.errors.length > 10) {
    this.lifecycle = 'DEGRADED';
  }
  
  return entry;
};

/**
 * Get Status
 */
K.getStatus = function() {
  return {
    lifecycle: this.lifecycle,
    services: this.services.size,
    modules: this.modules.size,
    errors: this.errors.length,
    uptime: Date.now() - this.diagnostics.startTime,
    diagnostics: this.diagnostics
  };
};

/**
 * Shutdown Kernel
 */
K.shutdown = function() {
  this.lifecycle = 'SHUTTING_DOWN';
  
  // Close all services
  for (const [name, entry] of this.services) {
    if (entry.service.close) {
      try {
        entry.service.close();
      } catch (err) {
        this.recordError(name, err, 'WARNING');
      }
    }
  }
  
  this.lifecycle = 'SHUTDOWN';
};

export { K };
