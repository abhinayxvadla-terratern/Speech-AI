import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { AdminRole } from '../lib/database.types';

interface AdminRoleRouteProps {
  allowedRoles: AdminRole[];
  tabName: string;
}

export const AdminRoleRoute: React.FC<AdminRoleRouteProps> = ({ allowedRoles, tabName }) => {
  const { role, isSuperAdmin } = useAdminAuth();
  const location = useLocation();

  // If superadmin ('admin'), always allow
  if (isSuperAdmin) {
    return <Outlet />;
  }

  // Check if current role is permitted
  const hasAccess = role && allowedRoles.includes(role);

  if (!hasAccess) {
    const roleLabel = role ? role.replace('_', ' ') : 'current';
    const message = `You don't have access to the ${tabName} section. Your role is '${roleLabel}', which does not have permission to view this tab.`;

    return (
      <Navigate
        to="/admin/overview"
        state={{
          accessDenied: true,
          deniedMessage: message,
          from: location.pathname,
        }}
        replace
      />
    );
  }

  return <Outlet />;
};
