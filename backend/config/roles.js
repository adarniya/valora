const ROLES = {
  SUPER_ADMIN: 1,
  MANAGER: 2,
  ACCOUNTANT: 3,
  SALES: 4,
  RETAILER: 5,
  WORKSHOP: 6
};

const PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: {
    canViewAllLedgers: true,
    canViewAllBills: true,
    canCreateBills: true,
    canRecordPayments: true,
    canViewReports: true,
    canManageProducts: true,
    canManageUsers: true,
    canPrint: true,
    description: 'Full system access'
  },
  [ROLES.MANAGER]: {
    canViewAllLedgers: true,
    canViewAllBills: true,
    canCreateBills: false,
    canRecordPayments: false,
    canViewReports: true,
    canManageProducts: false,
    canManageUsers: false,
    canPrint: true,
    description: 'View all data, future bill/payment creation'
  },
  [ROLES.ACCOUNTANT]: {
    canViewAllLedgers: true,
    canViewAllBills: true,
    canCreateBills: false,
    canRecordPayments: true,
    canViewReports: true,
    canManageProducts: false,
    canManageUsers: false,
    canPrint: true,
    description: 'View all data, record payments'
  },
  [ROLES.SALES]: {
    canViewAllLedgers: false,
    canViewAllBills: true,
    canCreateBills: true,
    canRecordPayments: true,
    canViewReports: true,
    canManageProducts: false,
    canManageUsers: false,
    canPrint: true,
    description: 'Create bills, record payments'
  },
  [ROLES.RETAILER]: {
    canViewAllLedgers: false,
    canViewAllBills: false,
    canCreateBills: false,
    canRecordPayments: false,
    canViewReports: false,
    canManageProducts: false,
    canManageUsers: false,
    canPrint: true,
    description: 'View only own data'
  },
  [ROLES.WORKSHOP]: {
    canViewAllLedgers: false,
    canViewAllBills: false,
    canCreateBills: false,
    canRecordPayments: false,
    canViewReports: false,
    canManageProducts: false,
    canManageUsers: false,
    canPrint: true,
    description: 'View only own data'
  }
};

const hasPermission = (roleId, permission) => {
  const rolePermissions = PERMISSIONS[roleId];
  return rolePermissions ? rolePermissions[permission] === true : false;
};

const canAccessUserData = (requestingUser, targetUserId) => {
  const roleId = requestingUser.role_id;
  if ([ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT].includes(roleId)) {
    return true;
  }
  if (roleId === ROLES.SALES) {
    return true;
  }
  return requestingUser.id === parseInt(targetUserId);
};

module.exports = { ROLES, PERMISSIONS, hasPermission, canAccessUserData };