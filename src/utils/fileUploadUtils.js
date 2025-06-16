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
 * @param {string} fieldName - The name of the field under which files will be sent (e.g., 'mediaFiles', 'images').
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
 * @param {string[]} allowedTypes - Array of allowed MIME type prefixes (e.g., ['image/', 'video/']).
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
                message: `File type not allowed: ${file.name}. Only ${allowedTypes.map(t => t.slice(0, -1)).join(', ')} files are permitted.`,
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
 * @param {FileList} fileList - The FileList object from a file input.
 * @returns {Promise<string[]>} A promise that resolves to an array of data URLs.
 */
export const previewImageFiles = async (fileList) => {
    const files = fileListToArray(fileList);
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

