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

export const PRIORITY_LEVELS = {
    LOW: 'low', // Consistent lowercase
    MEDIUM: 'medium', // Consistent lowercase
    HIGH: 'high', // Consistent lowercase
    URGENT: 'urgent', // For critical issues (e.g., burst pipe)
};

export const MAINTENANCE_CATEGORIES = {
    PLUMBING: 'plumbing', // Consistent lowercase
    ELECTRICAL: 'electrical', // Consistent lowercase
    HVAC: 'hvac', // Consistent lowercase
    STRUCTURAL: 'structural', // Consistent lowercase
    APPLIANCE: 'appliance', // Consistent lowercase
    GENERAL: 'general', // Consistent lowercase
    SECURITY: 'security', // Consistent lowercase
    PEST_CONTROL: 'pest_control', // Consistent lowercase
    LANDSCAPING: 'landscaping', // Consistent lowercase
    CLEANING: 'cleaning', // Consistent lowercase
    SCHEDULED: 'scheduled', // For requests generated from scheduled maintenance
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
// Ensure these match your React Router setup
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    ACCEPT_INVITE: '/invite/:token', // Changed to /invite/:token to match public service and common naming
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
    RESET_PASSWORD: '/reset-password/:token', // Added :token param
    ACCESS_DENIED: '/access-denied', // Added access denied route
    NOT_FOUND: '/404',
    // Role-specific dashboards (example, adjust as needed)
    TENANT_DASHBOARD: '/tenant-dashboard',
    PM_DASHBOARD: '/pm-dashboard',
    LANDLORD_DASHBOARD: '/landlord-dashboard',
    ADMIN_DASHBOARD: '/admin-dashboard',
};

// Other general constants
export const APP_NAME = "Fix It by Threalty";
export const DEBOUNCE_DELAY_MS = 500; // Default debounce delay for search inputs etc.
export const NOTIFICATION_POLLING_INTERVAL_MS = 60000; // Poll notifications every 60 seconds

// frontend/src/utils/fileUploadUtils.js

// This utility provides helper functions for handling file inputs in the frontend,
// primarily for converting FileList objects to FormData for API submission.

/**
 * Converts a FileList object (from an input type="file") into an array of File objects.
 * @param {FileList} fileList - The FileList object from a file input.
 * @returns {File[]} An array of File objects.
 */
export const fileListToArray = (fileList) => {
    if (!fileList) return [];
    return Array.from(fileList);
};

/**
 * Appends an array of File objects to a FormData object.
 * This is useful for sending files to a backend API that expects FormData.
 * @param {FormData} formData - The FormData object to append files to.
 * @param {File[]} files - An array of File objects.
 * @param {string} fieldName - The name of the field under which files will be sent (e.g., 'mediaFiles', 'images', 'files').
 */
export const appendFilesToFormData = (formData, files, fieldName = 'files') => {
    if (!formData || !files || files.length === 0) {
        return;
    }
    files.forEach(file => {
        formData.append(fieldName, file);
    });
};

/**
 * Validates selected files based on type and size.
 * @param {File[]} files - An array of File objects to validate.
 * @param {string[]} allowedTypes - Array of allowed MIME type prefixes (e.g., ['image/', 'video/', 'application/pdf']).
 * @param {number} maxSizeMB - Maximum allowed file size in megabytes.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export const validateFiles = (files, allowedTypes, maxSizeMB) => {
    if (!files || files.length === 0) {
        return { isValid: true, message: '' }; // No files, so considered valid for this check
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    for (const file of files) {
        // Check file type
        const isAllowedType = allowedTypes.some(type => file.type.startsWith(type));
        if (!isAllowedType) {
            return {
                isValid: false,
                message: `File type not allowed: ${file.name}. Only ${allowedTypes.map(t => t.split('/')[0]).join(', ')} files are permitted.`,
            };
        }

        // Check file size
        if (file.size > maxSizeBytes) {
            return {
                isValid: false,
                message: `File too large: ${file.name}. Maximum size is ${maxSizeMB}MB.`,
            };
        }
    }

    return { isValid: true, message: '' };
};

/**
 * Previews selected image files using FileReader.
 * @param {FileList|File[]} filesInput - The FileList object or an array of File objects.
 * @returns {Promise<string[]>} A promise that resolves to an array of data URLs.
 */
export const previewImageFiles = async (filesInput) => {
    const files = filesInput instanceof FileList ? fileListToArray(filesInput) : filesInput;
    const imageUrls = [];

    for (const file of files) {
        if (file.type.startsWith('image/')) {
            imageUrls.push(await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            }));
        }
    }
    return imageUrls;
};

// frontend/src/utils/helpers.js

// This file contains general utility functions, such as date formatting,
// string manipulation, and other common helpers.

/**
 * Formats a Date object or timestamp into a readable date string.
 * @param {Date|string} dateInput - The date to format (can be Date object or ISO string).
 * @param {object} [options] - Options for Intl.DateTimeFormat (e.g., { year: 'numeric', month: 'long', day: 'numeric' }).
 * @returns {string} The formatted date string.
 */
export const formatDate = (dateInput, options = {}) => {
    if (!dateInput) return '';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        // Default options for a common format if not provided
        const defaultOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Date Error';
    }
};

/**
 * Formats a Date object or timestamp into a readable date and time string.
 * @param {Date|string} dateInput - The date to format.
 * @param {object} [options] - Options for Intl.DateTimeFormat.
 * @returns {string} The formatted date and time string.
 */
export const formatDateTime = (dateInput, options = {}) => {
    if (!dateInput) return '';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            return 'Invalid Date/Time';
        }
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true, // Use 12-hour clock with AM/PM
        };
        return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
    } catch (error) {
        console.error('Error formatting date-time:', error);
        return 'Date/Time Error';
    }
};


/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The input string.
 * @returns {string} The string with the first letter capitalized.
 */
export const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncates a string to a specified length and adds an ellipsis.
 * @param {string} str - The input string.
 * @param {number} maxLength - The maximum length of the string before truncation.
 * @returns {string} The truncated string.
 */
export const truncateString = (str, maxLength) => {
    if (!str || str.length <= maxLength) {
        return str;
    }
    return str.substring(0, maxLength) + '...';
};

/**
 * Generates a full invitation link for a public acceptance page.
 * This link should point to your frontend's public invite acceptance route.
 * @param {string} token - The unique invitation token.
 * @returns {string} The complete invitation URL.
 */
export const generateInviteLink = (token) => {
    // Ensure VITE_FRONTEND_URL is correctly set in your .env file
    // This URL must match the frontend route configured for invite acceptance (e.g., /invite/:token).
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';
    return `${frontendUrl}/invite/${token}`; // Align with frontend route structure from ROUTES.ACCEPT_INVITE
};

/**
 * Determines if a file is an image based on its MIME type.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {boolean} True if the file is an image, false otherwise.
 */
export const isImage = (mimeType) => {
    return mimeType && mimeType.startsWith('image/');
};

/**
 * Determines if a file is a video based on its MIME type.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {boolean} True if the file is a video, false otherwise.
 */
export const isVideo = (mimeType) => {
    return mimeType && mimeType.startsWith('video/');
};

/**
 * Determines if a file is a PDF based on its MIME type.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {boolean} True if the file is a PDF, false otherwise.
 */
export const isPdf = (mimeType) => {
    return mimeType && mimeType === 'application/pdf';
};

/**
 * Converts an object of query parameters into a URL-encoded string.
 * @param {object} params - The object containing query parameters.
 * @returns {string} The URL-encoded query string (e.g., "key1=value1&key2=value2").
 */
export const buildQueryParams = (params) => {
    if (!params) return '';
    const queryString = Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
        .map(key => {
            const value = params[key];
            if (Array.isArray(value)) {
                return value.map(item => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`).join('&');
            }
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        })
        .join('&');
    return queryString ? `?${queryString}` : '';
};
