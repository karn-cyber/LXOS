// Validation helper functions for the LX Management Platform

/**
 * Validate date range
 */
export function validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { valid: false, error: 'Invalid date format' };
    }

    if (start >= end) {
        return { valid: false, error: 'End date must be after start date' };
    }

    if (start < new Date()) {
        return { valid: false, error: 'Start date cannot be in the past' };
    }

    return { valid: true };
}

/**
 * Validate budget allocation
 */
export function validateBudget(allocated, spent = 0, additional = 0) {
    if (allocated < 0 || spent < 0 || additional < 0) {
        return { valid: false, error: 'Budget values cannot be negative' };
    }

    if (spent > allocated) {
        return { valid: false, error: 'Spent amount exceeds allocated budget' };
    }

    if (spent + additional > allocated) {
        return {
            valid: false,
            error: `Adding ₹${additional.toLocaleString()} would exceed budget by ₹${(spent + additional - allocated).toLocaleString()}`
        };
    }

    return { valid: true, remaining: allocated - spent - additional };
}

/**
 * Validate email format
 */
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
    if (password.length < 6) {
        return { valid: false, error: 'Password must be at least 6 characters' };
    }

    return { valid: true };
}

/**
 * Validate room capacity
 */
export function validateCapacity(attendees, roomCapacity) {
    if (attendees > roomCapacity) {
        return {
            valid: false,
            error: `Room capacity (${roomCapacity}) is less than expected attendees (${attendees})`
        };
    }

    if (attendees > roomCapacity * 0.9) {
        return {
            valid: true,
            warning: `Room is near capacity (${Math.round((attendees / roomCapacity) * 100)}% full)`
        };
    }

    return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(sizeInBytes, maxSizeInMB = 10) {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (sizeInBytes > maxSizeInBytes) {
        return {
            valid: false,
            error: `File size (${(sizeInBytes / 1024 / 1024).toFixed(2)}MB) exceeds maximum (${maxSizeInMB}MB)`
        };
    }

    return { valid: true };
}

/**
 * Validate file type
 */
export function validateFileType(filename, allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']) {
    const extension = filename.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(extension)) {
        return {
            valid: false,
            error: `File type .${extension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
        };
    }

    return { valid: true };
}

/**
 * Validate required fields
 */
export function validateRequired(fields) {
    const errors = {};

    Object.entries(fields).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
            errors[key] = `${key} is required`;
        }
    });

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Check budget health
 */
export function getBudgetHealth(allocated, spent) {
    const percentage = (spent / allocated) * 100;

    if (percentage >= 90) {
        return { status: 'critical', color: 'red', message: 'Budget critically low' };
    }

    if (percentage >= 70) {
        return { status: 'warning', color: 'yellow', message: 'Budget running low' };
    }

    return { status: 'healthy', color: 'green', message: 'Budget healthy' };
}

/**
 * Format currency
 */
export function formatCurrency(amount) {
    return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Format date
 */
export function formatDate(date, includeTime = false) {
    const d = new Date(date);

    if (includeTime) {
        return d.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Calculate days until
 */
export function daysUntil(date) {
    const now = new Date();
    const target = new Date(date);
    const diff = target - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Past';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
}
