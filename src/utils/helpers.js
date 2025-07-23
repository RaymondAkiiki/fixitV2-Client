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

/**
 * Formats a number as a currency string
 * @param {number} amount - The amount to format
 * @param {string} [currencyCode='USD'] - The currency code (e.g., 'USD', 'EUR', 'GBP')
 * @param {string} [locale='en-US'] - The locale to use for formatting
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD', locale = 'en-US') => {
    if (amount === undefined || amount === null) return '';
    
    try {
        // Convert to number if it's a string
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        
        // Check if conversion resulted in a valid number
        if (isNaN(numericAmount)) {
            return 'Invalid Amount';
        }
        
        // Format using Intl.NumberFormat
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numericAmount);
    } catch (error) {
        console.error('Error formatting currency:', error);
        return `${currencyCode} ${amount}`;
    }
};

/**
 * Formats a size in bytes to a human-readable string (KB, MB, GB, etc)
 * @param {number} bytes - Size in bytes
 * @param {number} [decimals=2] - Number of decimal places to display
 * @returns {string} Formatted size string
 */
export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};