import type { UserRole } from '../types';

export type Permission =
  | 'dashboard:view'
  | 'patients:read'
  | 'patients:write'
  | 'appointments:read'
  | 'appointments:write'
  | 'clinical:read'
  | 'clinical:write'
  | 'billing:read'
  | 'billing:write'
  | 'suppliers:read'
  | 'suppliers:write'
  | 'tenants:admin';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  superadmin: [
    'dashboard:view','patients:read','patients:write','appointments:read','appointments:write',
    'clinical:read','clinical:write','billing:read','billing:write','suppliers:read','suppliers:write','tenants:admin',
  ],
  clinic_admin: [
    'dashboard:view','patients:read','patients:write','appointments:read','appointments:write',
    'clinical:read','billing:read','billing:write','suppliers:read','suppliers:write',
  ],
  dentist: [
    'dashboard:view','patients:read','patients:write','appointments:read','appointments:write',
    'clinical:read','clinical:write','billing:read',
  ],
  patient: ['dashboard:view','appointments:read','appointments:write','clinical:read','billing:read'],
};

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function sameTenant(userTenantId: string | undefined, targetTenantId: string): boolean {
  return Boolean(userTenantId && userTenantId === targetTenantId);
}

export function canAccessTenant(role: UserRole, userTenantId: string | undefined, targetTenantId: string): boolean {
  return role === 'superadmin' || sameTenant(userTenantId, targetTenantId);
}

export function assertPermission(role: UserRole, permission: Permission): void {
  if (!can(role, permission)) throw new Error(`Permiso denegado: ${permission}`);
}
