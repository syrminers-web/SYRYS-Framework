/**
 * SYRYS Scheduler
 * File: 1/e.js
 * Responsibility: Task Scheduling and Execution Management
 */

const Sch = {};

const tasks = new Map();
let taskIdCounter = 0;

Sch.init = function(FWK) {
  FWK.scheduler = {
    tasks: tasks,
    stats: {
      executed: 0,
      errors: 0,
      pending: 0,
      totalCreated: 0
    }
  };
  
  FWK.components.scheduler = Sch;
};

/**
 * Schedule Task (Interval)
 */
Sch.interval = function(callback, ticks = 20, metadata = {}) {
  const id = ++taskIdCounter;
  
  const task = {
    id,
    type: 'INTERVAL',
    callback,
    interval: ticks,
    elapsed: 0,
    executed: 0,
    active: true,
    createdAt: Date.now(),
    lastExecuted: null,
    errors: 0,
    metadata
  };
  
  tasks.set(id, task);
  this.stats.pending++;
  this.stats.totalCreated++;
  
  return id;
};

/**
 * Schedule Task (Timeout - One time execution)
 */
Sch.timeout = function(callback, ticks = 20, metadata = {}) {
  const id = ++taskIdCounter;
  
  const task = {
    id,
    type: 'TIMEOUT',
    callback,
    delay: ticks,
    elapsed: 0,
    executed: false,
    active: true,
    createdAt: Date.now(),
    errors: 0,
    metadata
  };
  
  tasks.set(id, task);
  this.stats.pending++;
  this.stats.totalCreated++;
  
  return id;
};

/**
 * Cancel Task
 */
Sch.cancel = function(id) {
  if (tasks.has(id)) {
    const task = tasks.get(id);
    task.active = false;
    tasks.delete(id);
    this.stats.pending--;
    return true;
  }
  return false;
};

/**
 * Pause Task
 */
Sch.pause = function(id) {
  if (tasks.has(id)) {
    tasks.get(id).active = false;
    return true;
  }
  return false;
};

/**
 * Resume Task
 */
Sch.resume = function(id) {
  if (tasks.has(id)) {
    tasks.get(id).active = true;
    return true;
  }
  return false;
};

/**
 * Process Tick - Called every server tick
 */
Sch.tick = function() {
  const toRemove = [];
  
  for (const [id, task] of tasks) {
    if (!task.active) continue;
    
    task.elapsed++;
    
    // Handle Timeout tasks
    if (task.type === 'TIMEOUT' && task.elapsed >= task.delay && !task.executed) {
      try {
        task.callback();
        task.executed = true;
        task.lastExecuted = Date.now();
        this.stats.executed++;
        toRemove.push(id);
      } catch (err) {
        task.errors++;
        this.stats.errors++;
        console.error(`[Scheduler] Timeout task ${id} error:`, err);
      }
    } 
    // Handle Interval tasks
    else if (task.type === 'INTERVAL' && task.elapsed >= task.interval) {
      try {
        task.callback();
        task.executed++;
        task.lastExecuted = Date.now();
        task.elapsed = 0;
        this.stats.executed++;
      } catch (err) {
        task.errors++;
        this.stats.errors++;
        console.error(`[Scheduler] Interval task ${id} error:`, err);
        
        // Auto-cancel on too many errors
        if (task.errors >= 5) {
          task.active = false;
          toRemove.push(id);
        }
      }
    }
  }
  
  // Clean up completed tasks
  for (const id of toRemove) {
    tasks.delete(id);
    this.stats.pending--;
  }
};

/**
 * Get Task Info
 */
Sch.getTask = function(id) {
  const task = tasks.get(id);
  if (!task) return null;
  
  return {
    ...task,
    callback: undefined // Don't expose callback
  };
};

/**
 * List All Tasks
 */
Sch.listTasks = function(filter = {}) {
  const results = [];
  
  for (const [id, task] of tasks) {
    if (filter.active !== undefined && task.active !== filter.active) continue;
    if (filter.type && task.type !== filter.type) continue;
    
    results.push({
      id,
      type: task.type,
      active: task.active,
      elapsed: task.elapsed,
      executed: task.executed,
      errors: task.errors
    });
  }
  
  return results;
};

/**
 * Get Stats
 */
Sch.getStats = function() {
  return {
    ...this.stats,
    activeTasks: Array.from(tasks.values()).filter(t => t.active).length
  };
};

/**
 * Clear All Tasks
 */
Sch.clearAll = function() {
  const count = tasks.size;
  tasks.clear();
  this.stats.pending = 0;
  return count;
};

export { Sch };
