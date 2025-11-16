// Permissions module for MSC Nexus.
// This will hold the MSC roles and permission helpers described
// in the MSC Nexus Master Prompt (Part 1).

export const MSC_ROLES = {
  DIRECTOR: "Director",
  DEPUTY_DIRECTOR: "DeputyDirector",
  STAFF_COORDINATOR: "StaffCoordinator",
  CORE: "Core",
  SUPPORT: "Support",
  STAFF: "Staff",
};

/**
 * Determine whether the given user can change a page's access mode.
 * Placeholder implementation: replace with real logic later.
 */
export function canChangeAccessMode(user) {
  if (!user) return false;
  return (
    user.role === MSC_ROLES.DIRECTOR ||
    user.role === MSC_ROLES.DEPUTY_DIRECTOR ||
    user.role === MSC_ROLES.STAFF_COORDINATOR
  );
}

/**
 * Determine whether the given user can edit a page.
 * Placeholder implementation aligned with the spec.
 */
export function canEditPage(user, page) {
  if (!user || !page) return false;
  if (page.accessMode === "readOnly") {
    return canChangeAccessMode(user);
  }
  // For editable pages, all roles except Staff can edit.
  if (user.role === MSC_ROLES.STAFF) {
    return false;
  }
  return true;
}