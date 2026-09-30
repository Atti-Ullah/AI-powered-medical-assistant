// Options shared by the admin profile form (dropdowns) and the API that validates them
export const ADMIN_ROLES = [
  'System Administrator',
  'Platform Administrator',
  'Security Administrator',
  'Support Administrator',
  'Content Administrator',
  'Compliance Officer',
];

export const ADMIN_DEPARTMENTS = [
  'IT Administration',
  'Operations',
  'Clinical Affairs',
  'Security & Compliance',
  'Customer Support',
  'Data & Analytics',
];

export const ADMIN_PERMISSIONS = [
  'Full Access',
  'Read & Write',
  'Read Only',
  'User Management Only',
  'Reports Only',
];

export const PROFILE_DEFAULTS = {
  adminRole: ADMIN_ROLES[0],
  department: ADMIN_DEPARTMENTS[0],
  permissions: ADMIN_PERMISSIONS[0],
};

export const MAX_AVATAR_LENGTH = 200000; // characters of the data URL (~150 KB image)
