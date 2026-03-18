// Permission matrix for role-based access control

export const ROLES = {
    ADMIN: 'ADMIN',
    LX_TEAM: 'LX_TEAM',
    CLUB_HEAD: 'CLUB_HEAD',
    CLAN_HEAD: 'CLAN_HEAD',
    FINANCE: 'FINANCE',
};

export const PERMISSIONS = {
    // Event permissions
    CREATE_EVENT: 'CREATE_EVENT',
    EDIT_EVENT: 'EDIT_EVENT',
    DELETE_EVENT: 'DELETE_EVENT',
    APPROVE_EVENT: 'APPROVE_EVENT',
    VIEW_ALL_EVENTS: 'VIEW_ALL_EVENTS',

    // Club permissions
    CREATE_CLUB: 'CREATE_CLUB',
    EDIT_CLUB: 'EDIT_CLUB',
    DELETE_CLUB: 'DELETE_CLUB',
    VIEW_ALL_CLUBS: 'VIEW_ALL_CLUBS',
    MANAGE_CLUB_BUDGET: 'MANAGE_CLUB_BUDGET',

    // Clan permissions
    MANAGE_CLANS: 'MANAGE_CLANS',
    ALLOCATE_CLAN_POINTS: 'ALLOCATE_CLAN_POINTS',
    VIEW_OWN_CLAN: 'VIEW_OWN_CLAN',
    EDIT_OWN_CLAN: 'EDIT_OWN_CLAN',
    MANAGE_CLAN_EVENTS: 'MANAGE_CLAN_EVENTS',
    MANAGE_CLAN_INITIATIVES: 'MANAGE_CLAN_INITIATIVES',
    MANAGE_CLAN_BLOG: 'MANAGE_CLAN_BLOG',

    // Room permissions
    CREATE_ROOM: 'CREATE_ROOM',
    EDIT_ROOM: 'EDIT_ROOM',
    DELETE_ROOM: 'DELETE_ROOM',
    APPROVE_BOOKING: 'APPROVE_BOOKING',

    // Budget permissions
    ALLOCATE_BUDGET: 'ALLOCATE_BUDGET',
    APPROVE_EXPENSE: 'APPROVE_EXPENSE',
    VIEW_ALL_BUDGETS: 'VIEW_ALL_BUDGETS',

    // File permissions
    UPLOAD_FILE: 'UPLOAD_FILE',
    DELETE_FILE: 'DELETE_FILE',
    VIEW_ALL_FILES: 'VIEW_ALL_FILES',

    // Analytics permissions
    VIEW_ANALYTICS: 'VIEW_ANALYTICS',

    // User management
    MANAGE_USERS: 'MANAGE_USERS',

    // Achievement permissions
    CREATE_ACHIEVEMENT: 'CREATE_ACHIEVEMENT',
    EDIT_ACHIEVEMENT: 'EDIT_ACHIEVEMENT',
    DELETE_ACHIEVEMENT: 'DELETE_ACHIEVEMENT',
};

const rolePermissions = {
    [ROLES.ADMIN]: [
        // Full access to everything
        PERMISSIONS.CREATE_EVENT,
        PERMISSIONS.EDIT_EVENT,
        PERMISSIONS.DELETE_EVENT,
        PERMISSIONS.APPROVE_EVENT,
        PERMISSIONS.VIEW_ALL_EVENTS,
        PERMISSIONS.CREATE_CLUB,
        PERMISSIONS.EDIT_CLUB,
        PERMISSIONS.DELETE_CLUB,
        PERMISSIONS.VIEW_ALL_CLUBS,
        PERMISSIONS.MANAGE_CLUB_BUDGET,
        PERMISSIONS.MANAGE_CLANS,
        PERMISSIONS.ALLOCATE_CLAN_POINTS,
        PERMISSIONS.VIEW_OWN_CLAN,
        PERMISSIONS.EDIT_OWN_CLAN,
        PERMISSIONS.MANAGE_CLAN_EVENTS,
        PERMISSIONS.MANAGE_CLAN_INITIATIVES,
        PERMISSIONS.MANAGE_CLAN_BLOG,
        PERMISSIONS.CREATE_ROOM,
        PERMISSIONS.EDIT_ROOM,
        PERMISSIONS.DELETE_ROOM,
        PERMISSIONS.APPROVE_BOOKING,
        PERMISSIONS.ALLOCATE_BUDGET,
        PERMISSIONS.APPROVE_EXPENSE,
        PERMISSIONS.VIEW_ALL_BUDGETS,
        PERMISSIONS.UPLOAD_FILE,
        PERMISSIONS.DELETE_FILE,
        PERMISSIONS.VIEW_ALL_FILES,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.CREATE_ACHIEVEMENT,
        PERMISSIONS.EDIT_ACHIEVEMENT,
        PERMISSIONS.DELETE_ACHIEVEMENT,
    ],

    [ROLES.LX_TEAM]: [
        // Can create LX events, manage budgets, upload bills, view analytics
        PERMISSIONS.CREATE_EVENT,
        PERMISSIONS.EDIT_EVENT,
        PERMISSIONS.VIEW_ALL_EVENTS,
        PERMISSIONS.VIEW_ALL_CLUBS,
        PERMISSIONS.MANAGE_CLUB_BUDGET,
        PERMISSIONS.UPLOAD_FILE,
        PERMISSIONS.VIEW_ALL_FILES,
        PERMISSIONS.VIEW_ANALYTICS,
    ],

    [ROLES.CLUB_HEAD]: [
        // Can request events, request rooms, view own club budget
        PERMISSIONS.CREATE_EVENT,
        PERMISSIONS.UPLOAD_FILE,
        PERMISSIONS.VIEW_ALL_CLUBS, // To see club list, but write restricted by component
        PERMISSIONS.CREATE_ACHIEVEMENT, // Implicitly needing logic
    ],

    [ROLES.CLAN_HEAD]: [
        // Clan leaders can manage their own clan data and events
        PERMISSIONS.VIEW_OWN_CLAN,
        PERMISSIONS.EDIT_OWN_CLAN,
        PERMISSIONS.MANAGE_CLAN_EVENTS,
        PERMISSIONS.MANAGE_CLAN_INITIATIVES,
        PERMISSIONS.MANAGE_CLAN_BLOG,
        PERMISSIONS.CREATE_EVENT,
        PERMISSIONS.UPLOAD_FILE,
        PERMISSIONS.VIEW_ALL_EVENTS, // Can view all events for participation
    ],

    [ROLES.FINANCE]: [
        // Can verify expenses, view bills, approve budget usage
        PERMISSIONS.APPROVE_EXPENSE,
        PERMISSIONS.VIEW_ALL_BUDGETS,
        PERMISSIONS.VIEW_ALL_FILES,
        PERMISSIONS.VIEW_ANALYTICS,
    ],
};

/**
 * Check if a user has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
    if (!role || !permission) return false;
    const permissions = rolePermissions[role] || [];
    return permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export function hasAnyPermission(role, permissions) {
    return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a user has all of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export function hasAllPermissions(role, permissions) {
    return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]}
 */
export function getRolePermissions(role) {
    return rolePermissions[role] || [];
}
