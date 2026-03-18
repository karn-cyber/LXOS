// Test utilities for the LX Management Platform

/**
 * Mock session for testing
 */
export function createMockSession(role = 'ADMIN') {
    return {
        user: {
            id: 'test-user-id',
            name: 'Test User',
            email: `${role.toLowerCase()}@test.com`,
            role: role,
        },
    };
}

/**
 * Mock event data
 */
export function createMockEvent(overrides = {}) {
    return {
        _id: 'test-event-id',
        title: 'Test Event',
        description: 'Test event description',
        type: 'CLUB',
        status: 'PENDING',
        startDate: new Date('2024-04-01T10:00:00Z'),
        endDate: new Date('2024-04-01T18:00:00Z'),
        budgetAllocated: 50000,
        budgetSpent: 0,
        attendees: 100,
        requirements: [],
        createdBy: 'test-user-id',
        ...overrides,
    };
}

/**
 * Mock expense data
 */
export function createMockExpense(overrides = {}) {
    return {
        _id: 'test-expense-id',
        eventId: 'test-event-id',
        title: 'Test Expense',
        description: 'Test expense description',
        amount: 10000,
        category: 'Food',
        status: 'PENDING',
        paidDate: new Date('2024-03-20'),
        submittedBy: 'test-user-id',
        ...overrides,
    };
}

/**
 * Mock club data
 */
export function createMockClub(overrides = {}) {
    return {
        _id: 'test-club-id',
        name: 'Test Club',
        description: 'Test club description',
        category: 'Technical',
        budgetAllocated: 200000,
        budgetSpent: 50000,
        isActive: true,
        ...overrides,
    };
}

/**
 * Mock clan data
 */
export function createMockClan(overrides = {}) {
    return {
        _id: 'test-clan-id',
        name: 'Test Clan',
        color: '#FF6B35',
        points: 1000,
        budgetAllocated: 150000,
        budgetSpent: 30000,
        ...overrides,
    };
}

/**
 * Mock room data
 */
export function createMockRoom(overrides = {}) {
    return {
        _id: 'test-room-id',
        name: 'Test Room',
        type: 'Classroom',
        capacity: 50,
        location: 'Building A, Floor 1',
        facilities: ['Projector', 'Whiteboard'],
        isAvailable: true,
        ...overrides,
    };
}

/**
 * Mock achievement data
 */
export function createMockAchievement(overrides = {}) {
    return {
        _id: 'test-achievement-id',
        title: 'Test Achievement',
        description: 'Test achievement description',
        category: 'Competition',
        date: new Date('2024-03-15'),
        pointsAwarded: 100,
        participants: ['John Doe', 'Jane Smith'],
        ...overrides,
    };
}

/**
 * Test API response
 */
export async function testApiCall(url, options = {}) {
    try {
        const response = await fetch(url, options);
        const data = await response.json();

        return {
            success: response.ok,
            status: response.status,
            data,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Validate response structure
 */
export function validateResponse(response, expectedFields) {
    const errors = [];

    expectedFields.forEach(field => {
        if (!(field in response)) {
            errors.push(`Missing field: ${field}`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Test date range validation
 */
export function testDateValidation() {
    const tests = [
        {
            name: 'Valid future dates',
            start: new Date(Date.now() + 86400000), // Tomorrow
            end: new Date(Date.now() + 172800000), // Day after
            shouldPass: true,
        },
        {
            name: 'End before start',
            start: new Date('2024-04-02'),
            end: new Date('2024-04-01'),
            shouldPass: false,
        },
        {
            name: 'Past dates',
            start: new Date('2023-01-01'),
            end: new Date('2023-01-02'),
            shouldPass: false,
        },
    ];

    return tests;
}

/**
 * Test budget validation
 */
export function testBudgetValidation() {
    const tests = [
        {
            name: 'Valid budget',
            allocated: 100000,
            spent: 50000,
            additional: 30000,
            shouldPass: true,
        },
        {
            name: 'Exceeds budget',
            allocated: 100000,
            spent: 80000,
            additional: 30000,
            shouldPass: false,
        },
        {
            name: 'Negative values',
            allocated: -100000,
            spent: 0,
            additional: 0,
            shouldPass: false,
        },
    ];

    return tests;
}

/**
 * Performance timer
 */
export class PerformanceTimer {
    constructor(name) {
        this.name = name;
        this.start = performance.now();
    }

    end() {
        const duration = performance.now() - this.start;
        console.log(`${this.name}: ${duration.toFixed(2)}ms`);
        return duration;
    }
}

/**
 * Database connection test
 */
export async function testDatabaseConnection() {
    try {
        const response = await fetch('/api/health');
        return response.ok;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

/**
 * Test role permissions
 */
export function testPermissions(role, action) {
    const permissions = {
        ADMIN: ['create', 'read', 'update', 'delete', 'approve'],
        LX_TEAM: ['create', 'read', 'approve'],
        FINANCE: ['read', 'verify'],
        CLUB_HEAD: ['create', 'read'],
        STUDENT: ['read'],
    };

    return permissions[role]?.includes(action) || false;
}

/**
 * Generate test data
 */
export function generateTestData(count = 10, type = 'event') {
    const generators = {
        event: createMockEvent,
        expense: createMockExpense,
        club: createMockClub,
        clan: createMockClan,
        room: createMockRoom,
        achievement: createMockAchievement,
    };

    const generator = generators[type];
    if (!generator) {
        throw new Error(`Unknown type: ${type}`);
    }

    return Array.from({ length: count }, (_, i) =>
        generator({ _id: `test-${type}-${i}` })
    );
}

/**
 * Clean test data
 */
export async function cleanTestData() {
    // This would delete all test data from the database
    // Implement based on your testing strategy
    console.warn('Clean test data not implemented');
}

/**
 * Run test suite
 */
export async function runTests(tests) {
    const results = {
        passed: 0,
        failed: 0,
        errors: [],
    };

    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                results.passed++;
                console.log(`✅ ${test.name}`);
            } else {
                results.failed++;
                console.log(`❌ ${test.name}`);
                results.errors.push(test.name);
            }
        } catch (error) {
            results.failed++;
            console.log(`❌ ${test.name}: ${error.message}`);
            results.errors.push({ name: test.name, error: error.message });
        }
    }

    console.log(`\nResults: ${results.passed} passed, ${results.failed} failed`);
    return results;
}

export default {
    createMockSession,
    createMockEvent,
    createMockExpense,
    createMockClub,
    createMockClan,
    createMockRoom,
    createMockAchievement,
    testApiCall,
    validateResponse,
    testDateValidation,
    testBudgetValidation,
    PerformanceTimer,
    testDatabaseConnection,
    testPermissions,
    generateTestData,
    cleanTestData,
    runTests,
};
