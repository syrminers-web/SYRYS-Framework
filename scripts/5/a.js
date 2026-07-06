/**
 * SYRYS Services Layer
 * File: 5/a.js
 * Responsibility: Permission Service & Access Control
 */

const PermissionService = {};

const permissions = new Map();
const roles = new Map();
const acl = new Map();

PermissionService.init = function(FWK) {
  // Initialize default roles
  this.createRole('OWNER', ['*'], 'Ultimate access - Framework Owner');
  this.createRole('ADMIN', ['admin.*', 'kernel.*', 'services.*'], 'Administrative access');
  this.createRole('MODERATOR', ['moderator.*', 'player.manage'], 'Moderation access');
  this.createRole('HELPER', ['help.*', 'player.info'], 'Helper access');
  this.createRole('PLAYER', ['player.*'], 'Standard player access');
  this.createRole('GUEST', ['guest.*'], 'Limited guest access');
  
  FWK.services = FWK.services || new Map();
  FWK.services.set('PermissionService', {
    service: PermissionService,
    version: '1.0.0',
    status: 'READY'
  });
};

/**
 * Create Role
 */
PermissionService.createRole = function(roleName, perms, description = '') {
  const role = {
    name: roleName,
    permissions: perms,
    description,
    createdAt: Date.now(),
    memberCount: 0
  };
  
  roles.set(roleName, role);
  return role;
};

/**
 * Get Role
 */
PermissionService.getRole = function(roleName) {
  return roles.get(roleName) || null;
};

/**
 * Delete Role
 */
PermissionService.deleteRole = function(roleName) {
  if (roleName === 'OWNER') return false; // Cannot delete OWNER role
  return roles.delete(roleName);
};

/**
 * Grant Permission
 */
PermissionService.grantPermission = function(identity, permission) {
  const key = `${identity.uuid}:${permission}`;
  
  acl.set(key, {
    uuid: identity.uuid,
    xuid: identity.xuid,
    permission,
    grantedAt: Date.now(),
    grantedBy: 'SYSTEM'
  });
  
  return true;
};

/**
 * Revoke Permission
 */
PermissionService.revokePermission = function(identity, permission) {
  const key = `${identity.uuid}:${permission}`;
  return acl.delete(key);
};

/**
 * Check Permission
 */
PermissionService.check = function(identity, permission) {
  // Owner override
  if (identity.xuid === '2535431027277180') {
    return true;
  }
  
  // Check explicit permission
  const explicitKey = `${identity.uuid}:${permission}`;
  if (acl.has(explicitKey)) {
    return true;
  }
  
  // Check role permissions
  if (identity.role) {
    const role = roles.get(identity.role);
    if (role) {
      for (const perm of role.permissions) {
        if (perm === '*') return true;
        if (perm === permission) return true;
        if (perm.endsWith('.*')) {
          const prefix = perm.slice(0, -2);
          if (permission.startsWith(prefix + '.')) return true;
        }
      }
    }
  }
  
  return false;
};

/**
 * Assign Role
 */
PermissionService.assignRole = function(identity, roleName) {
  if (!roles.has(roleName)) {
    return false;
  }
  
  identity.role = roleName;
  roles.get(roleName).memberCount++;
  return true;
};

/**
 * Remove Role
 */
PermissionService.removeRole = function(identity) {
  if (identity.role) {
    const role = roles.get(identity.role);
    if (role) {
      role.memberCount--;
    }
    identity.role = null;
    return true;
  }
  return false;
};

/**
 * List Permissions for Identity
 */
PermissionService.listPermissions = function(identity) {
  const perms = [];
  
  // Add role permissions
  if (identity.role) {
    const role = roles.get(identity.role);
    if (role) {
      perms.push(...role.permissions);
    }
  }
  
  // Add explicit permissions
  for (const [key, entry] of acl) {
    if (entry.uuid === identity.uuid) {
      perms.push(entry.permission);
    }
  }
  
  return [...new Set(perms)]; // Remove duplicates
};

/**
 * List All Roles
 */
PermissionService.listRoles = function() {
  const results = [];
  
  for (const [name, role] of roles) {
    results.push({
      name,
      permissions: role.permissions,
      description: role.description,
      members: role.memberCount
    });
  }
  
  return results;
};

/**
 * Has Role
 */
PermissionService.hasRole = function(identity, roleName) {
  return identity.role === roleName;
};

/**
 * Check Any Permission
 */
PermissionService.checkAny = function(identity, permissions) {
  for (const perm of permissions) {
    if (this.check(identity, perm)) {
      return true;
    }
  }
  return false;
};

/**
 * Check All Permissions
 */
PermissionService.checkAll = function(identity, permissions) {
  for (const perm of permissions) {
    if (!this.check(identity, perm)) {
      return false;
    }
  }
  return true;
};

/**
 * Get Stats
 */
PermissionService.getStats = function() {
  return {
    roles: roles.size,
    permissions: acl.size,
    totalMembers: Array.from(roles.values()).reduce((sum, r) => sum + r.memberCount, 0)
  };
};

export { PermissionService };
