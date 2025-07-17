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
    NEW: 'new', // Consistent lowercase
    ASSIGNED: 'assigned', // Consistent lowercase
    IN_PROGRESS: 'in_progress', // Consistent lowercase
    COMPLETED: 'completed', // Consistent lowercase
    VERIFIED: 'verified', // By PM/Landlord after completion
    REOPENED: 'reopened', // If not satisfactory
    ARCHIVED: 'archived', // Old, closed requests
};

export const SCHEDULED_MAINTENANCE_STATUS_ENUM = {
    ACTIVE: 'active', // Scheduled and upcoming
    IN_PROGRESS: 'in_progress', // Work has started
    COMPLETED: 'completed', // Work is done
    CANCELED: 'canceled', // Task was cancelled
};

export const LEASE_STATUS_ENUM = {
    DRAFT: 'draft', // Lease being prepared
    ACTIVE: 'active', // Current, active lease
    PENDING_RENEWAL: 'pending_renewal', // Lease is ending soon, renewal in progress
    EXPIRED: 'expired', // Lease term has ended
    TERMINATED: 'terminated', // Lease was ended prematurely
};

export const PRIORITY_LEVELS = {
    LOW: 'low', // Consistent lowercase
    MEDIUM: 'medium', // Consistent lowercase
    HIGH: 'high', // Consistent lowercase
    URGENT: 'urgent', // For critical issues (e.g., burst pipe)
};

export const MAINTENANCE_CATEGORIES = [
    'plumbing',
    'electrical',
    'hvac',
    'appliance',
    'structural',
    'landscaping',
    'other', // This was in your backend enum, good to include if needed
    'cleaning',
    'security',
    'pest_control',
    'painting', // From backend enum
    'roofing', // From backend enum
    'carpentry', // From backend enum
    'general_repair', // From backend enum
    'scheduled', // If you still want this as a category
];

export const RENT_STATUS_ENUM = {
    DUE: 'due', // Rent is due
    PAID: 'paid', // Rent has been paid
    OVERDUE: 'overdue', // Rent is past due date
    PARTIALLY_PAID: 'partially_paid', // Partial payment received
    WAIVED: 'waived', // Rent waived by landlord/PM
};

export const INVITATION_STATUSES = {
    PENDING: 'pending', // Consistent lowercase
    ACCEPTED: 'accepted', // Consistent lowercase
    EXPIRED: 'expired', // Consistent lowercase
    REVOKED: 'revoked', // Consistent lowercase
    DECLINED: 'declined', // Added 'Declined' status
};

export const FREQUENCY_OPTIONS = {
    DAILY: 'daily', // Consistent lowercase
    WEEKLY: 'weekly', // Consistent lowercase
    MONTHLY: 'monthly', // Consistent lowercase
    QUARTERLY: 'quarterly', // Consistent lowercase
    BI_ANNUALLY: 'bi_annually', // Consistent lowercase
    ANNUALLY: 'annually', // Consistent lowercase
    CUSTOM: 'custom', // For more complex recurring patterns
};

// General API response messages (can be used for front-end feedback)
// These are examples; actual messages should come from backend error responses
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
// These now match the optimized App.jsx routing and pages folder structure
export const ROUTES = {
    HOME: '/', // Initial redirect handled by InitialRedirect component
    WELCOME: '/welcome', // Explicit welcome/marketing page
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password/:token', // For setting new password via token
    ACCEPT_INVITE: '/invite/:token', // Public invite acceptance page
    

    // Public View Pages (no auth required, for external access)
    PUBLIC_REQUEST_VIEW: '/public/requests/:publicToken',
    PUBLIC_SCHEDULED_MAINTENANCE_VIEW: '/public/scheduled-maintenance/:publicToken',

    // Role-specific Base Paths (handled by ProtectedRoute and Layouts)
    ADMIN_BASE: '/admin',
    PM_BASE: '/pm',
    LANDLORD_BASE: '/landlord',
    TENANT_BASE: '/tenant',

    // Role-specific Dashboards (nested under base paths)
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_DASHBOARD_RELATIVE: 'dashboard',
    PM_DASHBOARD: '/pm/dashboard',
    LANDLORD_DASHBOARD: '/landlord/dashboard',
    TENANT_DASHBOARD: '/tenant/dashboard',

    // Role-specific Profiles (nested under base paths)
    ADMIN_PROFILE: '/admin/profile',
    PM_PROFILE: '/pm/profile',
    LANDLORD_PROFILE: '/landlord/profile',
    TENANT_PROFILE: '/tenant/profile',

    // Admin-specific pages (nested under ADMIN_BASE)
    ADMIN_SYSTEM: '/admin/system',
    ADMIN_AUDIT_LOGS: '/admin/audit-logs',
    ADMIN_MEDIA_GALLERY: '/admin/media-gallery', // Centralized media management for admin

    // Shared Feature Pages (nested under relevant role base paths)
    // Users
    USERS: '/users', // Lists all users (filterable by role, property, etc.)
    USER_DETAILS: '/users/:userId',
    USER_ADD: '/users/add',
    USER_EDIT: '/users/edit/:userId',

    // Properties
    PROPERTIES: '/properties', // Lists all properties
    PROPERTY_DETAILS: '/properties/:propertyId',
    PROPERTY_ADD: '/properties/add',
    PROPERTY_EDIT: '/properties/edit/:propertyId',

    // Units (nested under properties)
    UNITS_FOR_PROPERTY: '/properties/:propertyId/units',
    UNIT_DETAILS: '/properties/:propertyId/units/:unitId',
    UNIT_ADD: '/properties/:propertyId/units/add',
    UNIT_EDIT: '/properties/:propertyId/units/edit/:unitId',
    TENANT_MY_UNIT: '/tenant/my-unit', // Tenant's specific unit page

    // Requests
    REQUESTS: '/requests', // Lists all maintenance requests
    REQUEST_DETAILS: '/requests/:requestId',
    REQUEST_ADD: '/requests/add',
    REQUEST_EDIT: '/requests/edit/:requestId',

    // Scheduled Maintenance
    SCHEDULED_MAINTENANCE: '/scheduled-maintenance',
    SCHEDULED_MAINTENANCE_DETAILS: '/scheduled-maintenance/:taskId',
    SCHEDULED_MAINTENANCE_ADD: '/scheduled-maintenance/add',
    SCHEDULED_MAINTENANCE_EDIT: '/scheduled-maintenance/edit/:taskId',

    // Vendors
    VENDORS: '/vendors',
    VENDOR_DETAILS: '/vendors/:vendorId',
    VENDOR_ADD: '/vendors/add',
    VENDOR_EDIT: '/vendors/edit/:vendorId',

    // Invites
    INVITES: '/invites', // Lists all invites
    INVITE_SEND: '/invites/send', // Form for sending invites

    // Leases
    LEASES: '/leases',
    LEASE_DETAILS: '/leases/:leaseId',
    LEASE_ADD: '/leases/add',
    LEASE_EDIT: '/leases/edit/:leaseId',

    // Payments
    PAYMENTS: '/payments',
    PAYMENT_DETAILS: '/payments/:paymentId',
    PAYMENT_RECORD: '/payments/record', // Form for recording payments

    // Messages
    MESSAGES: '/messages',
    MESSAGE_DETAILS: '/messages/:messageId',
    MESSAGE_COMPOSE: '/messages/compose',

    // Notifications
    NOTIFICATIONS: '/notifications', // Centralized notification list page

    // Onboarding
    ONBOARDING: '/onboarding',
    ONBOARDING_DETAILS: '/onboarding/:onboardingId',
    ONBOARDING_ADD: '/onboarding/add',
    ONBOARDING_EDIT: '/onboarding/edit/:onboardingId',

    // Reports
    REPORTS: '/reports', // Main reports dashboard
    REPORTS_MAINTENANCE: '/reports/maintenance',
    REPORTS_VENDOR_PERFORMANCE: '/reports/vendor-performance',
    REPORTS_RENT: '/reports/rent',

    // Error Pages
    ACCESS_DENIED: '/access-denied',
    FORBIDDEN: '/403', // Alias for access denied
    NOT_FOUND: '/404', // Catch-all for unmatched routes

    // Other General/Extra Pages
    COMING_SOON: '/coming-soon',
    DEMO: '/demo',
    FEATURES: '/features',
    FEEDBACK: '/feedback',
    PRICING: '/pricing',
    PRIVACY: '/privacy',
    SUPPORT: '/support',
    TERMS: '/terms',
    TEST: '/test',
    TEST2: '/test2',
};

// Other general constants
export const APP_NAME = "Fix It by Threalty";
export const DEBOUNCE_DELAY_MS = 500; // Default debounce delay for search inputs etc.
export const NOTIFICATION_POLLING_INTERVAL_MS = 60000; // Poll notifications every 60 seconds
