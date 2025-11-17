// Permissions module for MSC Nexus.
// Implements the MSC roles and permission checks as per the spec.

export const MSC_ROLES = {
  DIRECTOR: "Director",
  DEPUTY_DIRECTOR: "DeputyDirector",
  STAFF_COORDINATOR: "StaffCoordinator",
  CORE: "Core",
  SUPPORT: "Support",
  STAFF: "Staff",
};

/**
 * Return true if the user can change a page's access mode.
 * Only Director, DeputyDirector, and StaffCoordinator are allowed.
 */
export function canChangeAccessMode(user) {
  if (!user) return false;

  const role = user.role;
  return (
    role === MSC_ROLES.DIRECTOR ||
    role === MSC_ROLES.DEPUTY_DIRECTOR ||
    role === MSC_ROLES.STAFF_COORDINATOR
  );
}

/**
 * Return true if the user can edit the given page.
 *
 * Spec behaviour:
 * - If page.accessMode === "readOnly": only users who can change
 *   access mode (Director/DeputyDirector/StaffCoordinator) can edit.
 * - Otherwise (editable): return true for now (later we can refine
 *   per-role behaviour; for Step 2, all roles may edit editable pages).
 */
export function canEditPage(user, page) {
  if (!user || !page) return false;

  if (page.accessMode === "readOnly") {
    return canChangeAccessMode(user);
  }

  // For editable pages, allow editing for all roles (spec for now).
  return true;
}
