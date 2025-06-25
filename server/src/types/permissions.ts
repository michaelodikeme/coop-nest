export enum Module {
    ADMIN = 'ADMIN',
    ACCOUNT = 'ACCOUNT',
    USER = 'USER',
    LOAN = 'LOAN',
    SAVINGS = 'SAVINGS',
    SHARES = 'SHARES',
    SYSTEM = 'SYSTEM',
    REPORTS = 'REPORTS',
    TRANSACTION = 'TRANSACTION',
    REQUEST = 'REQUEST',
    MEMBERS = 'MEMBERS',
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
    WITHDRAW = 'WITHDRAW',
    REQUEST = 'REQUEST'
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
        requiredApprovalLevel: 1
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
    {
        name: 'EDIT_MEMBERS',
        description: 'Edit member accounts',
        module: Module.MEMBERS,
        action: Action.UPDATE
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
        requiredApprovalLevel: 1
    },
    {
        name: 'PROCESS_LOAN_APPLICATIONS',
        description: 'Can process loan applications',
        module: Module.LOAN,
        action: Action.CREATE,
        requiredApprovalLevel: 1
    },
    {
        name: 'PROCESS_LOANS_REPAYMENT',
        description: 'Can process loan repayments',
        module: Module.LOAN,
        action: Action.CREATE,
        requiredApprovalLevel: 1
    },
    {
        name: 'VIEW_LOAN_REPAYMENT_HISTORY',
        description: 'Can view loan repayment history',
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
        name: 'PROCESS_SAVINGS',
        description: 'Can process savings transactions',
        module: Module.SAVINGS,
        action: Action.CREATE,
        requiredApprovalLevel: 1
    },
    {
        name: 'REQUEST_WITHDRAWAL',
        description: 'Can request savings withdrawals',
        module: Module.SAVINGS,
        action: Action.REQUEST
    },
    {
        name: 'VIEW_WITHDRAWAL_REQUESTS',
        description: 'Can view savings withdrawal requests',
        module: Module.SAVINGS,
        action: Action.READ
    },
    {
        name: 'REVIEW_WITHDRAWAL',
        description: 'Can review withdrawal requests (first level)',
        module: Module.SAVINGS,
        action: Action.REVIEW,
        requiredApprovalLevel: 1
    },
    {
        name: 'VERIFY_WITHDRAWAL',
        description: 'Can verify withdrawal requests (second level)',
        module: Module.SAVINGS,
        action: Action.VERIFY,
        requiredApprovalLevel: 2
    },
    {
        name: 'APPROVE_WITHDRAWAL',
        description: 'Can approve withdrawal requests (final level)',
        module: Module.SAVINGS,
        action: Action.APPROVE,
        requiredApprovalLevel: 3
    },
    {
        name: 'PROCESS_WITHDRAWAL',
        description: 'Can process approved withdrawals',
        module: Module.SAVINGS,
        action: Action.WITHDRAW,
        requiredApprovalLevel: 2
    },
    {
        name: 'VIEW_SAVINGS_STATS',
        description: 'Can view savings statistics and reports',
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
        action: Action.READ
    },
    {
        name: 'REQUEST_PERSONAL_SAVINGS',
        description: 'Can request creation of personal savings plans',
        module: Module.SAVINGS,
        action: Action.REQUEST,
        requiredApprovalLevel: 1
    },
    {
        name: 'PROCESS_PERSONAL_SAVINGS_DEPOSITS',
        description: 'Can process deposits into personal savings plans',
        module: Module.SAVINGS,
        action: Action.CREATE,
        requiredApprovalLevel: 1
    },
    {
        name: 'REQUEST_PERSONAL_SAVINGS_WITHDRAWAL',
        description: 'Can request withdrawal from personal savings plans',
        module: Module.SAVINGS,
        action: Action.REQUEST
    },
    {
        name: 'PROCESS_PERSONAL_SAVINGS_WITHDRAWAL',
        description: 'Can process approved withdrawals from personal savings plans',
        module: Module.SAVINGS,
        action: Action.WITHDRAW,
        requiredApprovalLevel: 2
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
        requiredApprovalLevel: 0  // Available to all users regardless of level
    },
    
    // Upload Management
    {
        name: 'UPLOAD_SAVINGS',
        description: 'Can upload savings and loan documents',
        module: Module.SAVINGS,
        action: Action.CREATE,
        requiredApprovalLevel: 1
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
    
    // Transaction Management Permissions
    {
        name: 'CREATE_TRANSACTION',
        description: 'Can create new transactions',
        module: Module.TRANSACTION,
        action: Action.CREATE,
        requiredApprovalLevel: 1
    },
    {
        name: 'VIEW_TRANSACTIONS',
        description: 'Can view transactions',
        module: Module.TRANSACTION,
        action: Action.READ,
        requiredApprovalLevel: 0 // All users can view their own transactions
    },
    {
        name: 'UPDATE_TRANSACTION',
        description: 'Can update transaction status',
        module: Module.TRANSACTION,
        action: Action.UPDATE,
        requiredApprovalLevel: 1
    },
    {
        name: 'REVERSE_TRANSACTION',
        description: 'Can reverse transactions',
        module: Module.TRANSACTION,
        action: Action.UPDATE,
        requiredApprovalLevel: 2 // Higher approval level for reversals
    },
    {
        name: 'VIEW_TRANSACTION_ANALYTICS',
        description: 'Can view transaction analytics and summaries',
        module: Module.REPORTS,
        action: Action.READ,
        requiredApprovalLevel: 1
    },
    {
        name: 'GENERATE_REPORTS',
        description: 'Can generate financial reports',
        module: Module.REPORTS,
        action: Action.READ,
        requiredApprovalLevel: 1
    },
    
    // Request Management Permissions
    {
        name: 'VIEW_REQUESTS',
        description: 'Can view requests made by users',
        module: Module.REQUEST,
        action: Action.READ,
        // requiredApprovalLevel: 0 // All users can view their own requests
    },
    {
        name: 'REVIEW_REQUESTS',
        description: 'Can review requests (first level approval)',
        module: Module.REQUEST,
        action: Action.REVIEW,
        requiredApprovalLevel: 1
    },
    {
        name: 'VERIFY_REQUESTS',
        description: 'Can verify requests (second level approval)',
        module: Module.REQUEST,
        action: Action.VERIFY,
        requiredApprovalLevel: 2
    },
    {
        name: 'APPROVE_REQUESTS', 
        description: 'Can approve requests (final level approval)',
        module: Module.REQUEST,
        action: Action.APPROVE,
        requiredApprovalLevel: 3
    },
    {
        name: 'PROCESS_REQUESTS',
        description: 'Can process approved requests',
        module: Module.REQUEST,
        action: Action.CREATE,
        requiredApprovalLevel: 2
    }
];

// Define default roles with their permissions
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
            'VIEW_SAVINGS', 
            'VIEW_SHARES', 'APPROVE_SHARES_LIQUIDATION',
            'APPROVE_LOANS', 'VIEW_REPORTS',
            'MANAGE_ROLES', 'MANAGE_SHARE_AMOUNT',
            'VIEW_TRANSACTIONS',
            'CREATE_TRANSACTION',
            'UPDATE_TRANSACTION',
            'REVERSE_TRANSACTION',
            'VIEW_TRANSACTION_ANALYTICS',
            'GENERATE_REPORTS',
            'APPROVE_WITHDRAWAL',
            'VIEW_WITHDRAWAL_REQUESTS',
            'VIEW_SAVINGS_STATS',
            'VIEW_REQUESTS'
        ],
        approvalLevel: 3,
        canApprove: true,
        moduleAccess: [Module.ADMIN, Module.LOAN, Module.SAVINGS, Module.SHARES, Module.REPORTS, Module.ACCOUNT, Module.TRANSACTION],
        isSystem: true
    },
    {
        name: 'TREASURER',
        description: 'Manages financial transactions and disbursements',
        permissions: [
            'VIEW_MEMBERS', 'VERIFY_MEMBERS',
            'REVIEW_LOAN', 'DISBURSE_LOAN',
            'APPROVE_ACCOUNTS', 
            'PROCESS_SAVINGS',
            'VIEW_REPORTS', 'VIEW_SHARES_CONFIG',
            'PROCESS_LOANS_REPAYMENT',
            'VIEW_TRANSACTIONS',
            'CREATE_TRANSACTION',
            'UPDATE_TRANSACTION',
            'REVERSE_TRANSACTION',
            'VIEW_TRANSACTION_ANALYTICS',
            'GENERATE_REPORTS',
            'VERIFY_WITHDRAWAL',
            'PROCESS_WITHDRAWAL',
            'PROCESS_PERSONAL_SAVINGS_WITHDRAWAL',
            'VIEW_WITHDRAWAL_REQUESTS',
            'VIEW_SAVINGS_STATS',
            'VIEW_REQUESTS'
        ],
        approvalLevel: 2,
        canApprove: true,
        moduleAccess: [Module.LOAN, Module.SAVINGS, Module.SHARES, Module.REPORTS, Module.ACCOUNT, Module.TRANSACTION],
        isSystem: true
    },
    {
        name: 'ADMIN',
        description: 'Administrative staff with review capabilities',
        permissions: [
            'VIEW_MEMBERS', 'VERIFY_MEMBERS',
            'REVIEW_LOAN', 'VIEW_LOANS', 'CREATE_MEMBERS',
            'PROCESS_SAVINGS', 'EDIT_USERS',
            'VIEW_REPORTS', 'UPLOAD_SAVINGS',
            'PROCESS_LOANS_REPAYMENT',
            'REVIEW_LOAN_APPLICATIONS',
            'VIEW_TRANSACTIONS',
            'CREATE_TRANSACTION',
            'UPDATE_TRANSACTION',
            'VIEW_TRANSACTION_ANALYTICS',
            'GENERATE_REPORTS',
            'REVIEW_WITHDRAWAL',
            'VIEW_WITHDRAWAL_REQUESTS',
            'VIEW_SAVINGS_STATS', 'VIEW_SAVINGS',
            'VIEW_REQUESTS'
        ],
        approvalLevel: 1,
        canApprove: false,
        moduleAccess: [Module.ACCOUNT, Module.LOAN, Module.SAVINGS, Module.SHARES, Module.REPORTS, Module.TRANSACTION],
        isSystem: true
    },
    {
        name: 'MEMBER',
        description: 'Regular cooperative member',
        permissions: [
            'EDIT_MEMBERS',
            'VIEW_MEMBERS',
            'INITIATE_LOAN',
            'VIEW_SAVINGS',
            'VIEW_SHARES',
            'VIEW_LOANS',
            'EDIT_USERS',
            'VIEW_ACCOUNTS',
            'VIEW_TRANSACTIONS',
            'REQUEST_WITHDRAWAL',
            'VIEW_WITHDRAWAL_REQUESTS',
            'VIEW_OWN_PROFILE',  // Add the new permission here
            'CREATE_PERSONAL_SAVINGS',
            'REQUEST_PERSONAL_SAVINGS',
            'VIEW_PERSONAL_SAVINGS'
        ],
        approvalLevel: 0,
        canApprove: false,
        moduleAccess: [Module.ACCOUNT, Module.LOAN, Module.SAVINGS, Module.SHARES, Module.REPORTS, Module.TRANSACTION, Module.MEMBERS],
        isSystem: true
    }
];