import { useState, useCallback } from 'react';
import api from '../api/axios';
import { useGlobalAlert } from '../contexts/GlobalAlertContext.jsx';

/**
 * Custom hook for making standardized API requests.
 * It handles loading states and provides a structured way to interact with the API.
 * NOTE: This hook does NOT automatically show error alerts. It's the responsibility
 * of the calling component to catch errors and display appropriate feedback.
 */
const useApi = () => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { showError } = useGlobalAlert(); // Keep for convenience if a component wants to use it

    const resetState = useCallback(() => {
        setData(null);
        setIsLoading(false);
        setError(null);
    }, []);

    const makeRequest = useCallback(async (method, url, body = null, params = null, headers = {}) => {
        setIsLoading(true);
        setError(null);
        setData(null);

        try {
            const config = {
                method,
                url,
                headers,
                data: body,
                params,
            };

            const response = await api(config);
            setData(response.data);
            return response.data; // Return data for direct use
        } catch (err) {
            const apiError = err.response?.data?.message || err.message || 'An unexpected API error occurred.';
            setError(apiError); // Set the error state for the component to read
            throw new Error(apiError); // Re-throw a simplified error message
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { data, isLoading, error, makeRequest, resetState, showError };
};

export default useApi;