import { MSCRoles } from './roles.js';

/**
 * Check if user can access MSC Nexus system
 * @param {Object} user - User object from Firestore
 * @returns {boolean} True if user has valid access
 */
export function canAccessNexus(user) {
  if (!user) return false;
  
  // Check if user has a valid role
  const validRoles = [
    MSCRoles.Director,
    MSCRoles.DeputyDirector,
    MSCRoles.StaffCoordinator,
    MSCRoles.Core,
    MSCRoles.Support,
    MSCRoles.Staff
  ];
  
  if (!user.role || !validRoles.includes(user.role)) {
    return false;
  }
  
  // User must have a valid shared UID
  if (!user.sharedUid) {
    return false;
  }
  
  return true;
}

/**
 * Check if user is in leadership role
 * @param {Object} user - User object from Firestore
 * @returns {boolean} True if user is leadership
 */
export function isLeadership(user) {
  if (!user || !user.role) return false;
  
  const leadershipRoles = [
    MSCRoles.Director,
    MSCRoles.DeputyDirector,
    MSCRoles.StaffCoordinator
  ];
  
  return leadershipRoles.includes(user.role);
}

/**
 * Check if user is allowed to edit content
 * @param {Object} user - User object from Firestore
 * @param {string} pageId - Optional page identifier for future fine-grained control
 * @returns {boolean} True if user can edit
 */
export function isEditingAllowed(user, pageId) {
  if (!user) return false;
  
  // Leadership always has editing permissions
  const leadership = [MSCRoles.Director, MSCRoles.DeputyDirector, MSCRoles.StaffCoordinator];
  if (leadership.includes(user.role)) return true;
  
  // Core & Support have editing permissions
  if ([MSCRoles.Core, MSCRoles.Support].includes(user.role)) return true;
  
  // Staff is read-only
  return false;
}

/**
 * Get user-friendly role label for display
 * @param {string} role - Role constant from MSCRoles
 * @returns {string} User-friendly role name
 */
export function getRoleLabel(role) {
  const roleLabels = {
    [MSCRoles.Director]: "Director",
    [MSCRoles.DeputyDirector]: "Deputy Director",
    [MSCRoles.StaffCoordinator]: "Staff Coordinator",
    [MSCRoles.Core]: "Core Team",
    [MSCRoles.Support]: "Support Team",
    [MSCRoles.Staff]: "Staff Member"
  };
  
  return roleLabels[role] || "Unknown Role";
}

/**
 * Get role permissions summary for UI display
 * @param {Object} user - User object from Firestore
 * @returns {Object} Permissions summary
 */
export function getPermissionsSummary(user) {
  return {
    canAccess: canAccessNexus(user),
    isLeadership: isLeadership(user),
    canEdit: isEditingAllowed(user),
    roleLabel: getRoleLabel(user?.role)
  };
}
