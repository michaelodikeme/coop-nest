import { Permission, Module, Action } from '@/types/role.types';

/**
 * All available system permissions
 * This matches the backend permissions definition
 */
export const PERMISSIONS: Permission[] = [
  // Users/Member Management
  {
    name: 'VIEW_MEMBERS',
    description: 'Can view member details',
    module: Module.ACCOUNT,
    action: Action.READ,
  },
  {
    name: 'CREATE_MEMBERS',
    description: 'Can verify member details',
    module: Module.USER,
    action: Action.CREATE,
    requiredApprovalLevel: 1,
  },
  {
    name: 'VERIFY_MEMBERS',
    description: 'Can verify member details',
    module: Module.ACCOUNT,
    action: Action.VERIFY,
    requiredApprovalLevel: 1,
  },
  {
    name: 'APPROVE_MEMBERS',
    description: 'Can approve member registration',
    module: Module.ACCOUNT,
    action: Action.APPROVE,
    requiredApprovalLevel: 2,
  },
  {
    name: 'VIEW_USERS',
    description: 'Can view user details',
    module: Module.USER,
    action: Action.READ,
  },
  {
    name: 'CREATE_USERS',
    description: 'Can create new users',
    module: Module.USER,
    action: Action.CREATE,
    requiredApprovalLevel: 1,
  },
  {
    name: 'EDIT_USERS',
    description: 'Can edit user details',
    module: Module.USER,
    action: Action.UPDATE,
    requiredApprovalLevel: 1,
  },
  {
    name: 'MANAGE_ROLES',
    description: 'Can assign and manage user roles',
    module: Module.USER,
    action: Action.MANAGE,
    requiredApprovalLevel: 2,
  },
  {
    name: 'EDIT_MEMBERS',
    description: 'Edit member accounts',
    module: Module.MEMBERS,
    action: Action.UPDATE,
  },

  // Account Management
  {
    name: 'VIEW_ACCOUNTS',
    description: 'Can view account details',
    module: Module.ACCOUNT,
    action: Action.READ,
  },
  {
    name: 'CREATE_ACCOUNTS',
    description: 'Can create new accounts',
    module: Module.ACCOUNT,
    action: Action.CREATE,
  },
  {
    name: 'UPDATE_ACCOUNTS',
    description: 'Can update account details',
    module: Module.ACCOUNT,
    action: Action.UPDATE,
    requiredApprovalLevel: 2,
  },
  {
    name: 'VERIFY_ACCOUNTS',
    description: 'Can verify accounts',
    module: Module.ACCOUNT,
    action: Action.VERIFY,
  },
  {
    name: 'APPROVE_ACCOUNTS',
    description: 'Can approve account requests',
    module: Module.ACCOUNT,
    action: Action.APPROVE,
  },

  // Loan Management
  {
    name: 'VIEW_LOANS',
    description: 'Can view loan details',
    module: Module.LOAN,
    action: Action.READ,
  },
  {
    name: 'INITIATE_LOAN',
    description: 'Can initiate loan applications',
    module: Module.LOAN,
    action: Action.CREATE,
  },
  {
    name: 'REVIEW_LOAN_APPLICATIONS',
    description: 'Can review loan applications',
    module: Module.LOAN,
    action: Action.REVIEW,
    requiredApprovalLevel: 1,
  },
  {
    name: 'PROCESS_LOAN_APPLICATIONS',
    description: 'Can process loan applications',
    module: Module.LOAN,
    action: Action.CREATE,
    requiredApprovalLevel: 1,
  },
  {
    name: 'PROCESS_LOANS_REPAYMENT',
    description: 'Can process loan repayments',
    module: Module.LOAN,
    action: Action.CREATE,
    requiredApprovalLevel: 1,
  },
  {
    name: 'VIEW_LOAN_REPAYMENT_HISTORY',
    description: 'Can view loan repayment history',
    module: Module.LOAN,
    action: Action.READ,
  },
  {
    name: 'CREATE_LOANS',
    description: 'Can create new loans',
    module: Module.LOAN,
    action: Action.CREATE,
  },
  {
    name: 'REVIEW_LOAN',
    description: 'Can review loan applications',
    module: Module.LOAN,
    action: Action.REVIEW,
    requiredApprovalLevel: 1,
  },
  {
    name: 'APPROVE_LOANS',
    description: 'Can approve loan requests',
    module: Module.LOAN,
    action: Action.APPROVE,
    requiredApprovalLevel: 3,
  },
  {
    name: 'DISBURSE_LOAN',
    description: 'Can disburse approved loans',
    module: Module.LOAN,
    action: Action.DISBURSE,
    requiredApprovalLevel: 2,
  },
  {
    name: 'MANAGE_LOAN_TYPES',
    description: 'Can manage loan types and configurations',
    module: Module.LOAN,
    action: Action.MANAGE,
    requiredApprovalLevel: 3,
  },

  // Savings Management
  {
    name: 'VIEW_SAVINGS',
    description: 'Can view savings details',
    module: Module.SAVINGS,
    action: Action.READ,
  },
  {
    name: 'PROCESS_DEPOSITS',
    description: 'Can process savings deposits',
    module: Module.SAVINGS,
    action: Action.CREATE,
    requiredApprovalLevel: 1,
  },
  {
    name: 'PROCESS_SAVINGS',
    description: 'Can process savings transactions',
    module: Module.SAVINGS,
    action: Action.CREATE,
    requiredApprovalLevel: 1,
  },
  {
    name: 'REQUEST_WITHDRAWAL',
    description: 'Can request savings withdrawals',
    module: Module.SAVINGS,
    action: Action.REQUEST,
  },
  {
    name: 'VIEW_WITHDRAWAL_REQUESTS',
    description: 'Can view savings withdrawal requests',
    module: Module.SAVINGS,
    action: Action.READ,
  },
  {
    name: 'REVIEW_WITHDRAWAL',
    description: 'Can review withdrawal requests (first level)',
    module: Module.SAVINGS,
    action: Action.REVIEW,
    requiredApprovalLevel: 1,
  },
  {
    name: 'VERIFY_WITHDRAWAL',
    description: 'Can verify withdrawal requests (second level)',
    module: Module.SAVINGS,
    action: Action.VERIFY,
    requiredApprovalLevel: 2,
  },
  {
    name: 'APPROVE_WITHDRAWAL',
    description: 'Can approve withdrawal requests (final level)',
    module: Module.SAVINGS,
    action: Action.APPROVE,
    requiredApprovalLevel: 3,
  },
  {
    name: 'PROCESS_WITHDRAWAL',
    description: 'Can process approved withdrawals',
    module: Module.SAVINGS,
    action: Action.WITHDRAW,
    requiredApprovalLevel: 2,
  },
  {
    name: 'VIEW_SAVINGS_STATS',
    description: 'Can view savings statistics and reports',
    module: Module.SAVINGS,
    action: Action.READ,
    requiredApprovalLevel: 1,
  },
  {
    name: 'MANAGE_SAVINGS_CONFIG',
    description: 'Can manage savings configuration',
    module: Module.SAVINGS,
    action: Action.MANAGE,
    requiredApprovalLevel: 3,
  },

  // Personal Savings
  {
    name: 'CREATE_PERSONAL_SAVINGS',
    description: 'Can create personal savings',
    module: Module.SAVINGS,
    action: Action.CREATE,
  },
  {
    name: 'VIEW_PERSONAL_SAVINGS',
    description: 'Can view personal savings details',
    module: Module.SAVINGS,
    action: Action.READ,
  },
  {
    name: 'REQUEST_PERSONAL_SAVINGS',
    description: 'Can request creation of personal savings plans',
    module: Module.SAVINGS,
    action: Action.REQUEST,
    requiredApprovalLevel: 1,
  },
  {
    name: 'PROCESS_PERSONAL_SAVINGS_DEPOSITS',
    description: 'Can process deposits into personal savings plans',
    module: Module.SAVINGS,
    action: Action.CREATE,
    requiredApprovalLevel: 1,
  },
  {
    name: 'REQUEST_PERSONAL_SAVINGS_WITHDRAWAL',
    description: 'Can request withdrawal from personal savings plans',
    module: Module.SAVINGS,
    action: Action.REQUEST,
  },
  {
    name: 'PROCESS_PERSONAL_SAVINGS_WITHDRAWAL',
    description: 'Can process approved withdrawals from personal savings plans',
    module: Module.SAVINGS,
    action: Action.WITHDRAW,
    requiredApprovalLevel: 2,
  },

  // Shares Management
  {
    name: 'VIEW_SHARES',
    description: 'Can view shares details',
    module: Module.SHARES,
    action: Action.READ,
  },
  {
    name: 'APPROVE_SHARE_TRANSACTIONS',
    description: 'Can approve share transactions',
    module: Module.SHARES,
    action: Action.APPROVE,
  },
  {
    name: 'APPROVE_SHARES_LIQUIDATION',
    description: 'Can approve shares liquidation (account closure)',
    module: Module.SHARES,
    action: Action.APPROVE,
    requiredApprovalLevel: 3,
  },
  {
    name: 'MANAGE_SHARE_AMOUNT',
    description: 'Can modify the default share amount',
    module: Module.SHARES,
    action: Action.MANAGE,
    requiredApprovalLevel: 3,
  },
  {
    name: 'VIEW_SHARES_CONFIG',
    description: 'Can view shares configuration',
    module: Module.SHARES,
    action: Action.READ,
    requiredApprovalLevel: 1,
  },

  // System Management
  {
    name: 'VIEW_SYSTEM_SETTINGS',
    description: 'Can view system settings',
    module: Module.SYSTEM,
    action: Action.READ,
  },
  {
    name: 'MANAGE_SYSTEM_SETTINGS',
    description: 'Can manage system settings',
    module: Module.SYSTEM,
    action: Action.MANAGE,
    requiredApprovalLevel: 2,
  },
  {
    name: 'VIEW_REPORTS',
    description: 'Can view system reports',
    module: Module.REPORTS,
    action: Action.READ,
    requiredApprovalLevel: 2,
  },
  {
    name: 'VIEW_PERMISSIONS',
    description: 'Can view user permissions',
    module: Module.USER,
    action: Action.READ,
  },
  {
    name: 'VIEW_OWN_PROFILE',
    description: 'Can view their own user profile and details',
    module: Module.USER,
    action: Action.READ,
    requiredApprovalLevel: 0,
  },

  // Upload Management
  {
    name: 'UPLOAD_SAVINGS',
    description: 'Can upload savings and loan documents',
    module: Module.SAVINGS,
    action: Action.CREATE,
    requiredApprovalLevel: 1,
  },
  {
    name: 'UPLOAD_BIODATA',
    description: 'Can manage uploaded documents',
    module: Module.USER,
    action: Action.CREATE,
    requiredApprovalLevel: 3,
  },
  {
    name: 'UPLOAD_LOANS',
    description: 'Can view uploaded documents',
    module: Module.LOAN,
    action: Action.CREATE,
    requiredApprovalLevel: 3,
  },

  // Transaction Management Permissions
  {
    name: 'CREATE_TRANSACTION',
    description: 'Can create new transactions',
    module: Module.TRANSACTION,
    action: Action.CREATE,
    requiredApprovalLevel: 1,
  },
  {
    name: 'VIEW_TRANSACTIONS',
    description: 'Can view transactions',
    module: Module.TRANSACTION,
    action: Action.READ,
    requiredApprovalLevel: 0,
  },
  {
    name: 'UPDATE_TRANSACTION',
    description: 'Can update transaction status',
    module: Module.TRANSACTION,
    action: Action.UPDATE,
    requiredApprovalLevel: 1,
  },
  {
    name: 'REVERSE_TRANSACTION',
    description: 'Can reverse transactions',
    module: Module.TRANSACTION,
    action: Action.UPDATE,
    requiredApprovalLevel: 2,
  },
  {
    name: 'VIEW_TRANSACTION_ANALYTICS',
    description: 'Can view transaction analytics and summaries',
    module: Module.REPORTS,
    action: Action.READ,
    requiredApprovalLevel: 1,
  },
  {
    name: 'GENERATE_REPORTS',
    description: 'Can generate financial reports',
    module: Module.REPORTS,
    action: Action.READ,
    requiredApprovalLevel: 1,
  },

  // Request Management Permissions
  {
    name: 'VIEW_REQUESTS',
    description: 'Can view requests made by users',
    module: Module.REQUEST,
    action: Action.READ,
  },
  {
    name: 'REVIEW_REQUESTS',
    description: 'Can review requests (first level approval)',
    module: Module.REQUEST,
    action: Action.REVIEW,
    requiredApprovalLevel: 1,
  },
  {
    name: 'VERIFY_REQUESTS',
    description: 'Can verify requests (second level approval)',
    module: Module.REQUEST,
    action: Action.VERIFY,
    requiredApprovalLevel: 2,
  },
  {
    name: 'APPROVE_REQUESTS',
    description: 'Can approve requests (final level approval)',
    module: Module.REQUEST,
    action: Action.APPROVE,
    requiredApprovalLevel: 3,
  },
  {
    name: 'PROCESS_REQUESTS',
    description: 'Can process approved requests',
    module: Module.REQUEST,
    action: Action.CREATE,
    requiredApprovalLevel: 2,
  },
];

/**
 * Group permissions by module
 */
export const getPermissionsByModule = (): Record<string, Permission[]> => {
  const grouped: Record<string, Permission[]> = {};

  PERMISSIONS.forEach((permission) => {
    const module = permission.module;
    if (!grouped[module]) {
      grouped[module] = [];
    }
    grouped[module].push(permission);
  });

  return grouped;
};

/**
 * Get all unique modules
 */
export const getAllModules = (): string[] => {
  return Object.values(Module);
};
