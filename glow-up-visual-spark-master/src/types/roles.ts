// Types for the denormalized roles structure
export type UserRole = 'admin' | 'viewer' | 'clerk' | 'donor' | 'member';

export interface UserRolesRecord {
  user_id: string;
  is_admin: boolean;
  is_viewer: boolean;
  is_clerk: boolean;
  is_donor: boolean;
  is_member: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserWithRoles extends UserRolesRecord {
  email?: string;
  // Add other user fields as needed
}

// Type guard to check if a string is a valid role
export function isUserRole(role: string): role is UserRole {
  return ['admin', 'viewer', 'clerk', 'donor', 'member'].includes(role);
}

// Helper to convert role string to column name
export function roleToColumn(role: UserRole): keyof UserRolesRecord {
  return `is_${role}` as keyof UserRolesRecord;
}

// Helper to get array of roles from UserRolesRecord
export function getRolesFromRecord(record: UserRolesRecord): UserRole[] {
  const roles: UserRole[] = [];
  if (record.is_admin) roles.push('admin');
  if (record.is_viewer) roles.push('viewer');
  if (record.is_clerk) roles.push('clerk');
  if (record.is_donor) roles.push('donor');
  if (record.is_member) roles.push('member');
  return roles;
}

// Helper to create a UserRolesRecord from roles array
export function createRolesRecord(userId: string, roles: UserRole[] = []): UserRolesRecord {
  return {
    user_id: userId,
    is_admin: roles.includes('admin'),
    is_viewer: roles.includes('viewer'),
    is_clerk: roles.includes('clerk'),
    is_donor: roles.includes('donor'),
    is_member: roles.includes('member'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
