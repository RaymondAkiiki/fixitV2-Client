// frontend/src/utils/constants.js

// This file defines various constant values and enums used throughout the frontend,
// ensuring consistency and easy management of fixed values.

export const USER_ROLES = {
    TENANT: 'tenant',
    LANDLORD: 'landlord',
    PROPERTY_MANAGER: 'propertymanager', // Consistent lowercase
    ADMIN: 'admin', // Consistent lowercase
    VENDOR: 'vendor', // Consistent lowercase
};

export const REQUEST_STATUSES = {
    NEW: 'New',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    VERIFIED: 'Verified', // By PM/Landlord after completion
    REOPENED: 'Reopened', // If not satisfactory
    ARCHIVED: 'Archived', // Old, closed requests
};

export const PRIORITY_LEVELS = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent', // For critical issues (e.g., burst pipe)
};

export const MAINTENANCE_CATEGORIES = {
    PLUMBING: 'Plumbing',
    ELECTRICAL: 'Electrical',
    HVAC: 'HVAC',
    STRUCTURAL: 'Structural',
    APPLIANCE: 'Appliance',
    GENERAL: 'General',
    SECURITY: 'Security',
    PEST_CONTROL: 'Pest Control',
    LANDSCAPING: 'Landscaping',
    CLEANING: 'Cleaning',
    SCHEDULED: 'Scheduled', // For requests generated from scheduled maintenance
};

export const INVITATION_STATUSES = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    EXPIRED: 'Expired',
    REVOKED: 'Revoked', // Added 'Revoked' status from backend Invite model
};

export const FREQUENCY_OPTIONS = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    BI_ANNUALLY: 'Bi-Annually',
    ANNUALLY: 'Annually',
    CUSTOM: 'Custom', // For more complex recurring patterns
};

// General API response messages (can be used for front-end feedback)
export const API_MESSAGES = {
    SUCCESS: 'Operation successful!',
    ERROR: 'An error occurred. Please try again.',
    NOT_AUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'Resource not found.',
    INVALID_INPUT: 'Invalid input provided.',
    LOGIN_SUCCESS: 'Logged in successfully!',
    REGISTER_SUCCESS: 'Account created successfully!',
    LOGOUT_SUCCESS: 'Logged out successfully.',
    INVITE_SENT: 'Invitation sent successfully!',
    INVITE_ACCEPTED: 'Invitation accepted. Your account is ready!',
    REQUEST_SUBMITTED: 'Maintenance request submitted successfully!',
    TASK_ASSIGNED: 'Task assigned successfully!',
    STATUS_UPDATED: 'Status updated successfully!',
    PROPERTY_CREATED: 'Property created successfully!',
    UNIT_CREATED: 'Unit created successfully!',
    VENDOR_CREATED: 'Vendor added successfully!',
    SCHEDULE_CREATED: 'Scheduled maintenance created successfully!',
};

// Frontend route paths (for consistent navigation)
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login', // Path without /auth for cleaner URLs
    REGISTER: '/register', // Path without /auth for cleaner URLs
    ACCEPT_INVITE: '/auth/accept-invite/:token', // Specific path to match backend invite controller
    DASHBOARD: '/dashboard',
    REQUESTS: '/requests',
    REQUEST_DETAILS: '/requests/:id',
    PROPERTIES: '/properties',
    UNITS: '/units',
    VENDORS: '/vendors',
    SCHEDULED_MAINTENANCE: '/scheduled-maintenance',
    INVITES: '/invites', // Page for PM/Landlord to send invites
    NOTIFICATIONS: '/notifications',
    REPORTS: '/reports',
    PROFILE: '/profile',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    NOT_FOUND: '/404',
};

