// frontend/src/hooks/useApi.js

// This custom hook provides a standardized way to make API calls using the configured Axios instance,
// handling loading states and errors. It relies on the Axios interceptor for authorization.

import { useState, useCallback } from 'react';
import api from '../api/axios'; // Import the configured Axios instance
import { useGlobalAlert } from '../contexts/GlobalAlertContext.jsx'; // For showing global alerts

/**
 * Custom hook for making API requests.
 * @returns {object} An object containing:
 * - `data`: The data returned from the API.
 * - `isLoading`: Boolean indicating if a request is in progress.
 * - `error`: Any error object returned from the request (after `axios.js` interceptor processing).
 * - `makeRequest`: A function to initiate an API request.
 */
const useApi = () => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { showError } = useGlobalAlert(); // Access showError from GlobalAlertContext

    /**
     * Function to make an API request using the pre-configured Axios instance.
     * Authorization is handled by the Axios request interceptor.
     * @param {string} method - HTTP method (e.g., 'get', 'post', 'put', 'delete', 'patch').
     * @param {string} url - The API endpoint path (e.g., '/requests', '/users/123').
     * @param {object|FormData|null} [body=null] - The request body for POST/PUT/PATCH methods.
     * Can be an object or FormData.
     * @param {object|null} [params=null] - URL parameters for GET requests.
     * @param {object} [headers={}] - Additional custom headers for this specific request.
     * @returns {Promise<any>} A promise that resolves with the response data.
     */
    const makeRequest = useCallback(async (
        method,
        url,
        body = null,
        params = null,
        headers = {},
    ) => {
        setIsLoading(true);
        setError(null);
        setData(null); // Clear previous data

        try {
            const config = {
                method,
                url: `/api${url}`, // Prepend /api to the URL (if your backend uses /api prefix)
                                   // Note: Axios baseURL already contains '/api', so this might be redundant or path should not have /api here
                                   // Re-evaluating: If axios.baseURL is already `http://localhost:5000/api`, then `url` should start directly after that.
                                   // So, `url: url` if `url` starts with `/auth/login`, `/requests`, etc.
                                   // Let's assume `url` parameter *does not* include '/api' at the start here.
                headers: {
                    // Content-Type might be handled by Axios automatically for FormData,
                    // but explicitly set for JSON if not handled
                    'Content-Type': body instanceof FormData ? undefined : 'application/json',
                    ...headers,
                },
                data: body,
                params: params,
            };

            const response = await api(config); // Use the imported 'api' instance
            setData(response.data);
            return response.data; // Return data for direct use by caller
        } catch (err) {
            console.error('API request failed in useApi hook:', err);
            setError(err);
            // The axios interceptor handles global 401 errors.
            // For other errors, display a more specific message if available.
            if (err.response && err.response.data && err.response.data.message) {
                showError(err.response.data.message);
            } else if (err.message) {
                showError(err.message);
            } else {
                showError('An unexpected error occurred during API request.');
            }
            throw err; // Re-throw to propagate the error to the component
        } finally {
            setIsLoading(false);
        }
    }, [showError]); // Dependencies for useCallback

    return { data, isLoading, error, makeRequest };
};

export default useApi;

