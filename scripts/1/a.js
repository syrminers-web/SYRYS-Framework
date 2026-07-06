/**
 * SYRYS Framework v1.0.0
 * Kernel Bootstrap Layer
 * 
 * File: 1/a.js (Kernel Entry Point)
 * Layer: Core
 * Responsibility: Initialize framework
 */

import { system, world } from '@minecraft/server';
import * as K from './b.js';
import * as Reg from './c.js';
import * as Evt from './d.js';
import * as Sch from './e.js';

/**
 * Framework State (Global)
 * Namespace: syrys.kernel
 */
const FWK = {
  version: '1.0.0',
  state: 'INIT',
  owner_xuid: '2535431027277180',
  components: {},
  ready: false,
  tick: 0
};

/**
 * Initialize Framework
 */
async function initializeFramework() {
  try {
    FWK.state = 'LOADING';
    
    // Initialize Kernel
    K.init(FWK);
    
    // Initialize Registry
    Reg.init(FWK);
    
    // Initialize Event Bus
    Evt.init(FWK);
    
    // Initialize Scheduler
    Sch.init(FWK);
    
    FWK.state = 'READY';
    FWK.ready = true;
    
    system.runTimeout(() => {
      Evt.emit('framework:ready', { timestamp: Date.now(), version: FWK.version });
    }, 1);
    
  } catch (err) {
    FWK.state = 'ERROR';
    console.error('[SYRYS] Initialization failed:', err);
  }
}

/**
 * Main Tick Loop
 */
system.runInterval(() => {
  FWK.tick++;
  
  if (!FWK.ready) {
    if (FWK.tick === 1) {
      initializeFramework();
    }
    return;
  }
  
  // Process scheduler
  Sch.tick();
}, 1);

/**
 * Export Framework State
 */
export { FWK };
