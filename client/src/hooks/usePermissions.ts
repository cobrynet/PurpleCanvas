import { useOrganization } from "./useOrganization";

type Permission = 
  | "view_dashboard"
  | "manage_campaigns"
  | "manage_leads"
  | "manage_opportunities"
  | "manage_tasks"
  | "manage_team"
  | "manage_settings"
  | "manage_billing"
  | "manage_integrations"
  | "create_content"
  | "publish_content"
  | "delete_data"
  | "export_data";

const rolePermissions: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    "view_dashboard",
    "manage_campaigns",
    "manage_leads",
    "manage_opportunities",
    "manage_tasks",
    "manage_team",
    "manage_settings",
    "manage_billing",
    "manage_integrations",
    "create_content",
    "publish_content",
    "delete_data",
    "export_data"
  ],
  ORG_ADMIN: [
    "view_dashboard",
    "manage_campaigns",
    "manage_leads",
    "manage_opportunities",
    "manage_tasks",
    "manage_team",
    "manage_settings",
    "manage_billing",
    "manage_integrations",
    "create_content",
    "publish_content",
    "delete_data",
    "export_data"
  ],
  MARKETER: [
    "view_dashboard",
    "manage_campaigns",
    "manage_tasks",
    "create_content",
    "publish_content",
    "export_data"
  ],
  SALES: [
    "view_dashboard",
    "manage_leads",
    "manage_opportunities",
    "manage_tasks",
    "export_data"
  ],
  VIEWER: [
    "view_dashboard"
  ]
};

export function usePermissions() {
  const { selectedOrganization } = useOrganization();
  const userRole = selectedOrganization?.membership?.role || "VIEWER";

  const hasPermission = (permission: Permission): boolean => {
    // SUPER_ADMIN has ALL permissions - no restrictions
    if (userRole === "SUPER_ADMIN") {
      return true;
    }

    const permissions = rolePermissions[userRole] || [];
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    // SUPER_ADMIN has ALL permissions
    if (userRole === "SUPER_ADMIN") {
      return true;
    }

    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    // SUPER_ADMIN has ALL permissions
    if (userRole === "SUPER_ADMIN") {
      return true;
    }

    return permissions.every(permission => hasPermission(permission));
  };

  const canManageTeam = (): boolean => {
    return hasPermission("manage_team");
  };

  const canManageSettings = (): boolean => {
    return hasPermission("manage_settings");
  };

  const canDeleteData = (): boolean => {
    return hasPermission("delete_data");
  };

  const canManageBilling = (): boolean => {
    return hasPermission("manage_billing");
  };

  const isAdmin = (): boolean => {
    return userRole === "SUPER_ADMIN" || userRole === "ORG_ADMIN";
  };

  const isSuperAdmin = (): boolean => {
    return userRole === "SUPER_ADMIN";
  };

  return {
    userRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageTeam,
    canManageSettings,
    canDeleteData,
    canManageBilling,
    isAdmin,
    isSuperAdmin
  };
}
