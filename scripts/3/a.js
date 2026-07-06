/**
 * SYRYS Core Layer
 * File: 3/a.js
 * Responsibility: Identity and Profile Management
 */

const Core = {};

const profiles = new Map();
const identities = new Map();
const sessions = new Map();

Core.init = function(FWK) {
  FWK.core = {
    profiles: profiles,
    identities: identities,
    sessions: sessions,
    owner_xuid: '2535431027277180',
    stats: {
      profilesCreated: 0,
      identitiesCreated: 0,
      sessionsActive: 0
    }
  };
  
  FWK.components.core = Core;
};

/**
 * Generate UUID
 */
Core.generateUUID = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Create Identity
 */
Core.createIdentity = function(xuid, name, type = 'MICROSOFT') {
  if (identities.has(xuid)) {
    return identities.get(xuid);
  }
  
  const identity = {
    uuid: this.generateUUID(),
    xuid,
    name,
    type,
    createdAt: Date.now(),
    lastSeen: Date.now(),
    trustLevel: type === 'MICROSOFT' ? 2 : 3,
    status: 'ACTIVE',
    roles: []
  };
  
  identities.set(xuid, identity);
  this.stats.identitiesCreated++;
  
  return identity;
};

/**
 * Get Identity
 */
Core.getIdentity = function(xuid) {
  const identity = identities.get(xuid);
  if (identity) {
    identity.lastSeen = Date.now();
  }
  return identity || null;
};

/**
 * Create Profile
 */
Core.createProfile = function(identity) {
  if (profiles.has(identity.uuid)) {
    return profiles.get(identity.uuid);
  }
  
  const profile = {
    uuid: identity.uuid,
    xuid: identity.xuid,
    identity,
    state: 'CREATED',
    data: {
      inventory: [],
      economy: {
        balance: 0,
        transactions: []
      },
      permissions: [],
      config: {},
      stats: {
        playtime: 0,
        deaths: 0,
        joins: 0
      }
    },
    metadata: {
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      version: '1.0.0',
      lastBackup: null
    },
    security: {
      passwordHash: null,
      twoFactorEnabled: false,
      trustedDevices: []
    }
  };
  
  profiles.set(identity.uuid, profile);
  this.stats.profilesCreated++;
  
  return profile;
};

/**
 * Get Profile
 */
Core.getProfile = function(uuid) {
  return profiles.get(uuid) || null;
};

/**
 * Get Profile by XUID
 */
Core.getProfileByXUID = function(xuid) {
  const identity = this.getIdentity(xuid);
  if (!identity) return null;
  return this.getProfile(identity.uuid);
};

/**
 * Update Profile
 */
Core.updateProfile = function(uuid, updates) {
  const profile = this.getProfile(uuid);
  if (!profile) return false;
  
  Object.assign(profile.data, updates);
  profile.metadata.modifiedAt = Date.now();
  
  return true;
};

/**
 * Create Session
 */
Core.createSession = function(xuid, sessionData = {}) {
  const identity = this.getIdentity(xuid);
  if (!identity) return null;
  
  const sessionId = this.generateUUID();
  
  const session = {
    id: sessionId,
    xuid,
    uuid: identity.uuid,
    startTime: Date.now(),
    lastActivity: Date.now(),
    active: true,
    data: sessionData,
    events: [],
    ipAddress: sessionData.ipAddress || 'unknown'
  };
  
  sessions.set(sessionId, session);
  this.stats.sessionsActive++;
  
  return session;
};

/**
 * Get Session
 */
Core.getSession = function(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = Date.now();
  }
  return session || null;
};

/**
 * End Session
 */
Core.endSession = function(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  session.active = false;
  session.endTime = Date.now();
  session.duration = session.endTime - session.startTime;
  this.stats.sessionsActive--;
  
  return true;
};

/**
 * Get Active Sessions for Player
 */
Core.getActiveSessions = function(xuid) {
  const results = [];
  
  for (const [, session] of sessions) {
    if (session.xuid === xuid && session.active) {
      results.push(session);
    }
  }
  
  return results;
};

/**
 * Add Role to Identity
 */
Core.addRole = function(xuid, role) {
  const identity = this.getIdentity(xuid);
  if (!identity) return false;
  
  if (!identity.roles.includes(role)) {
    identity.roles.push(role);
    return true;
  }
  
  return false;
};

/**
 * Remove Role from Identity
 */
Core.removeRole = function(xuid, role) {
  const identity = this.getIdentity(xuid);
  if (!identity) return false;
  
  const idx = identity.roles.indexOf(role);
  if (idx !== -1) {
    identity.roles.splice(idx, 1);
    return true;
  }
  
  return false;
};

/**
 * Check Role
 */
Core.hasRole = function(xuid, role) {
  const identity = this.getIdentity(xuid);
  if (!identity) return false;
  
  return identity.roles.includes(role);
};

/**
 * List All Profiles
 */
Core.listProfiles = function(limit = 100) {
  const results = [];
  let count = 0;
  
  for (const [, profile] of profiles) {
    if (count >= limit) break;
    results.push({
      uuid: profile.uuid,
      xuid: profile.xuid,
      name: profile.identity.name,
      createdAt: profile.metadata.createdAt,
      lastModified: profile.metadata.modifiedAt
    });
    count++;
  }
  
  return results;
};

/**
 * Get Stats
 */
Core.getStats = function() {
  return {
    ...this.stats,
    totalIdentities: identities.size,
    totalProfiles: profiles.size,
    activeSessions: Array.from(sessions.values()).filter(s => s.active).length
  };
};

export { Core };
