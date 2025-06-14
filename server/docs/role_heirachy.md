I now understand the complex role and approval hierarchies needed. From the prompt, here are the key points about roles, requests, and approval levels:

1. Hierarchical Approval Chain:
- Different roles have different approval levels and capabilities
- Approval process is sequential and role-specific
- Multiple approval levels required for certain actions

2. Request Flow Example (Loan Application):
```
Member (Initiator) -> Admin (Review) -> Treasurer (Review) -> Chairman (Approval) -> Treasurer (Disbursement)
Status Flow: PENDING -> IN_REVIEW -> REVIEWED -> APPROVED -> DISBURSED -> ACTIVE -> COMPLETED
```

3. Role-Based Access and Capabilities:
- Chairman: Final approval authority
- Treasurer: Financial transactions, disbursements
- Admin: Initial review, member management
- Members: Basic access, can initiate requests

Let me update our roles and permissions implementation to reflect this hierarchy:

```typescript
export enum Module {
    ADMIN = 'ADMIN',
    ACCOUNT = 'ACCOUNT',
    USER = 'USER',
    LOAN = 'LOAN',
    SAVINGS = 'SAVINGS',
    SHARES = 'SHARES',
    SYSTEM = 'SYSTEM',
    REPORTS = 'REPORTS'
}

export enum Action {
    CREATE = 'CREATE',
    READ = 'READ',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    APPROVE = 'APPROVE',
    REVIEW = 'REVIEW',
    VERIFY = 'VERIFY',
    MANAGE = 'MANAGE',
    DISBURSE = 'DISBURSE',
    WITHDRAW = 'WITHDRAW'
}

export interface Permission {
    name: string;
    description: string;
    module: Module;
    action: Action;
    requiredApprovalLevel?: number;
}

// Define all system permissions
export const PERMISSIONS: Permission[] = [
    // Users/Member Management
    {
        name: 'VIEW_MEMBERS',
        description: 'Can view member details',
        module: Module.ACCOUNT,
        action: Action.READ
    },
    {
        name: 'CREATE_MEMBERS',
        description: 'Can verify member details',
        module: Module.USER,
        action: Action.CREATE,
        requiredApprovalLevel: 2
    },
    {
        name: 'VERIFY_MEMBERS',
        description: 'Can verify member details',
        module: Module.ACCOUNT,
        action: Action.VERIFY,
        requiredApprovalLevel: 1
    },
    {
        name: 'APPROVE_MEMBERS',
        description: 'Can approve member registration',
        module: Module.ACCOUNT,
        action: Action.APPROVE,
        requiredApprovalLevel: 2
    },
    {
        name: 'VIEW_USERS',
        description: 'Can view user details',
        module: Module.USER,
        action: Action.READ
    },
    {
        name: 'CREATE_USERS',
        description: 'Can create new users',
        module: Module.USER,
        action: Action.CREATE,
        requiredApprovalLevel: 1
    },
    {
        name: 'EDIT_USERS',
        description: 'Can edit user details',
        module: Module.USER,
        action: Action.UPDATE,
        requiredApprovalLevel: 1
    },
    {
        name: 'MANAGE_ROLES',
        description: 'Can assign and manage user roles',
        module: Module.USER,
        action: Action.MANAGE,
        requiredApprovalLevel: 2
    },
    
    // Account Management
    {
        name: 'VIEW_ACCOUNTS',
        description: 'Can view account details',
        module: Module.ACCOUNT,
        action: Action.READ
    },
    {
        name: 'CREATE_ACCOUNTS',
        description: 'Can create new accounts',
        module: Module.ACCOUNT,
        action: Action.CREATE
    },
    {
        name: 'UPDATE_ACCOUNTS',
        description: 'Can update account details',
        module: Module.ACCOUNT,
        action: Action.UPDATE,
        requiredApprovalLevel: 2
    },
    {
        name: 'VERIFY_ACCOUNTS',
        description: 'Can verify accounts',
        module: Module.ACCOUNT,
        action: Action.VERIFY
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
        action: Action.READ
    },
    {
        name: 'CREATE_LOANS',
        description: 'Can create new loans',
        module: Module.LOAN,
        action: Action.CREATE
    },
    {
        name: 'REVIEW_LOAN',
        description: 'Can review loan applications',
        module: Module.LOAN,
        action: Action.REVIEW,
        requiredApprovalLevel: 1
    },
    {
        name: 'APPROVE_LOANS',
        description: 'Can approve loan requests',
        module: Module.LOAN,
        action: Action.APPROVE,
        requiredApprovalLevel: 3
    },
    {
        name: 'DISBURSE_LOAN',
        description: 'Can disburse approved loans',
        module: Module.LOAN,
        action: Action.DISBURSE,
        requiredApprovalLevel: 2
    },
    {
        name: 'MANAGE_LOAN_TYPES',
        description: 'Can manage loan types and configurations',
        module: Module.LOAN,
        action: Action.MANAGE,
        requiredApprovalLevel: 3
    },
    
    // Savings Management
    {
        name: 'VIEW_SAVINGS',
        description: 'Can view savings details',
        module: Module.SAVINGS,
        action: Action.READ
    },
    {
        name: 'PROCESS_DEPOSITS',
        description: 'Can process savings deposits',
        module: Module.SAVINGS,
        action: Action.CREATE,
        requiredApprovalLevel: 1
    },
    {
        name: 'REVIEW_WITHDRAWAL',
        description: 'Can review withdrawal requests',
        module: Module.SAVINGS,
        action: Action.REVIEW,
        requiredApprovalLevel: 1
    },
    {
        name: 'PROCESS_WITHDRAWAL',
        description: 'Can process approved withdrawals',
        module: Module.SAVINGS,
        action: Action.WITHDRAW,
        requiredApprovalLevel: 2
    },
    {
        name: 'APPROVE_WITHDRAWAL',
        description: 'Can approve withdrawal requests',
        module: Module.SAVINGS,
        action: Action.APPROVE,
        requiredApprovalLevel: 3
    },
    {
        name: 'VIEW_ALL_SAVINGS',
        description: 'Can view all members savings details',
        module: Module.SAVINGS,
        action: Action.READ,
        requiredApprovalLevel: 1
    },
    {
        name: 'VIEW_SAVINGS_STATS',
        description: 'Can view savings statistics',
        module: Module.SAVINGS,
        action: Action.READ,
        requiredApprovalLevel: 1
    },
    {
        name: 'MANAGE_SAVINGS_CONFIG',
        description: 'Can manage savings configuration',
        module: Module.SAVINGS,
        action: Action.MANAGE,
        requiredApprovalLevel: 3
    },
    
    // Shares Management
    {
        name: 'VIEW_SHARES',
        description: 'Can view shares details',
        module: Module.SHARES,
        action: Action.READ
    },
    {
        name: 'APPROVE_SHARE_TRANSACTIONS',
        description: 'Can approve share transactions',
        module: Module.SHARES,
        action: Action.APPROVE
    },
    {
        name: 'APPROVE_SHARES_LIQUIDATION',
        description: 'Can approve shares liquidation (account closure)',
        module: Module.SHARES,
        action: Action.APPROVE,
        requiredApprovalLevel: 3
    },
    {
        name: 'MANAGE_SHARE_AMOUNT',
        description: 'Can modify the default share amount',
        module: Module.SHARES,
        action: Action.MANAGE,
        requiredApprovalLevel: 3
    },
    {
        name: 'VIEW_SHARES_CONFIG',
        description: 'Can view shares configuration',
        module: Module.SHARES,
        action: Action.READ,
        requiredApprovalLevel: 1
    },
    
    // System Management
    {
        name: 'VIEW_SYSTEM_SETTINGS',
        description: 'Can view system settings',
        module: Module.SYSTEM,
        action: Action.READ
    },
    {
        name: 'MANAGE_SYSTEM_SETTINGS',
        description: 'Can manage system settings',
        module: Module.SYSTEM,
        action: Action.MANAGE,
        requiredApprovalLevel: 2
    },
    {
        name: 'MANAGE_ROLES',
        description: 'Can manage user roles',
        module: Module.ADMIN,
        action: Action.MANAGE,
        requiredApprovalLevel: 3
      },
      {
        name: 'VIEW_REPORTS',
        description: 'Can view system reports',
        module: Module.REPORTS,
        action: Action.READ,
        requiredApprovalLevel: 2
      },

    // Upload Management
    {
        name: 'UPLOAD_SAVINGS',
        description: 'Can upload savings and loan documents',
        module: Module.SAVINGS,
        action: Action.CREATE,
        requiredApprovalLevel: 3
    },
    {
        name: 'UPLOAD_BIODATA',
        description: 'Can manage uploaded documents',
        module: Module.USER,
        action: Action.CREATE,
        requiredApprovalLevel: 3
    },
    {
        name: 'UPLOAD_LOANS',
        description: 'Can view uploaded documents',
        module: Module.LOAN,
        action: Action.CREATE,
        requiredApprovalLevel: 3
    },
];

// Define default roles with their permissions and approval levels
export interface RoleDefinition {
  name: string;
  description: string;
  permissions: string[];
  approvalLevel: number;
  canApprove: boolean;
  moduleAccess: Module[];
  isSystem?: boolean; // System roles cannot be modified
}

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    name: 'SUPER_ADMIN',
    description: 'Full system access',
    permissions: PERMISSIONS.map(p => p.name),
    approvalLevel: 3,
    canApprove: true,
    moduleAccess: Object.values(Module)
  },
  {
    name: 'CHAIRMAN',
    description: 'Cooperative Chairman with highest approval authority',
    permissions: [
      'VIEW_MEMBERS', 'APPROVE_MEMBERS',
      'VIEW_SAVINGS', 'APPROVE_WITHDRAWAL',
      'VIEW_SHARES', 'APPROVE_SHARES_LIQUIDATION',
      'APPROVE_LOAN', 'VIEW_REPORTS',
      'MANAGE_ROLES', 'MANAGE_SHARE_AMOUNT'
    ],
    approvalLevel: 3,
    canApprove: true,
    moduleAccess: [Module.ADMIN, Module.LOAN, Module.SAVINGS, Module.SHARES, Module.REPORTS],
    isSystem: true
  },
  {
    name: 'TREASURER',
    description: 'Manages financial transactions and disbursements',
    permissions: [
      'VIEW_MEMBERS', 'VERIFY_MEMBERS',
      'REVIEW_LOAN', 'DISBURSE_LOAN', 'APPROVE_ACCOUNTS',
      'PROCESS_SAVINGS', 'APPROVE_WITHDRAWAL', 'PROCESS_WITHDRAWAL',
      'PROCESS_SHARES', 'VIEW_REPORTS', 'VIEW_SHARES_CONFIG'
    ],
    approvalLevel: 2,
    canApprove: true,
    moduleAccess: [Module.LOAN, Module.SAVINGS, Module.SHARES, Module.REPORTS,  Module.ACCOUNT],
    isSystem: true
  },
  {
    name: 'ADMIN',
    description: 'Administrative staff with review capabilities',
    permissions: [
      'VIEW_MEMBERS', 'VERIFY_MEMBERS',
      'REVIEW_LOAN', 'CREATE_MEMBERS',
      'PROCESS_SAVINGS', 'EDIT_USERS',
      'PROCESS_SHARES',
      'VIEW_REPORTS'
    ],
    approvalLevel: 1,
    canApprove: false,
    moduleAccess: [Module.ACCOUNT, Module.LOAN, Module.SAVINGS, Module.SHARES],
    isSystem: true
  },
  {
    name: 'MEMBER',
    description: 'Regular cooperative member',
    permissions: [
      'VIEW_MEMBERS',
      'INITIATE_LOAN',
      'VIEW_SAVINGS',
      'VIEW_SHARES',
      'VIEW_LOANS',
      'EDIT_USERS',
      'VIEW_ACCOUNTS'
    ],
    approvalLevel: 0,
    canApprove: false,
    moduleAccess: [Module.ACCOUNT, Module.LOAN, Module.SAVINGS, Module.SHARES],
    isSystem: true
  }
];
```

This implementation now properly reflects:

1. Hierarchical Approval Levels:
- Level 0: Members (no approval rights)
- Level 1: Admin (initial review)
- Level 2: Treasurer (financial operations)
- Level 3: Chairman (final approval)

2. Role-Specific Permissions:
- Clear separation of duties
- Required approval levels for sensitive operations
- Module-specific access control

3. Action Types:
- Added specific actions like DISBURSE and WITHDRAW
- Separated REVIEW from APPROVE actions
- Added VERIFY for intermediate steps

4. System Controls:
- isSystem flag to protect core roles
- Required approval levels for sensitive operations
- Clear module access definitions

Need to implement the validation and middleware components to enforce these roles and permissions