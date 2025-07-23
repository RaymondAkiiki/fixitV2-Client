import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './common/Button.jsx';
import { initGoogleAuth, handleGoogleSignIn } from '../services/authService';
import { useGlobalAlert } from '../contexts/GlobalAlertContext.jsx';
import { ROUTES } from '../utils/constants.js';

const GoogleAuthButton = ({ text = 'Sign in with Google', onSuccess, onError, usePopup = true }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const { showError, showSuccess } = useGlobalAlert();
  const navigate = useNavigate();
  const buttonRef = useRef(null);

  const handleGoogleResponse = useCallback(async (response) => {
    if (!response.credential) {
      showError('No credential received from Google');
      return;
    }

    setIsLoading(true);
    try {
      const result = await handleGoogleSignIn(response);
      
      if (result.success) {
        showSuccess(result.message || 'Successfully signed in with Google!');
        
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(result);
        } else {
          navigateBasedOnRole(result.user);
        }
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      showError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [showError, showSuccess, onSuccess, navigateBasedOnRole]);

  const renderGoogleButton = useCallback(() => {
    try {
      if (!window.google?.accounts) {
        setError('Google Identity Services not loaded');
        return;
      }

      if (!buttonRef.current) {
        setError('Button reference not found');
        return;
      }

      const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      // Initialize Google Identity Services with callback
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear any existing content
      buttonRef.current.innerHTML = '';

      // Render the button
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: buttonRef.current.offsetWidth || 300,
        text: 'signin_with',
        shape: 'rectangular',
      });

      setDebugInfo('Button rendered successfully');
    } catch (err) {
      console.error('Error rendering Google button:', err);
      setError(`Render failed: ${err.message}`);
      setDebugInfo(`Render error: ${err.message}`);
    }
  }, [handleGoogleResponse]);

  useEffect(() => {
    console.log('=== ENHANCED GOOGLE AUTH DEBUG ===');
    console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
    console.log('Current URL:', window.location.href);
    console.log('Origin:', window.location.origin);
    console.log('Host:', window.location.host);
    console.log('Protocol:', window.location.protocol);
    console.log('Port:', window.location.port);
    console.log('User Agent:', navigator.userAgent);
    console.log('================================');
    const initializeGoogleAuth = async () => {
      try {
        setDebugInfo('Starting initialization...');
        
        // Check if environment variable exists
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        console.log('Client ID found:', !!clientId);
        setDebugInfo(`Client ID exists: ${!!clientId}`);
        
        if (!clientId) {
          throw new Error('VITE_GOOGLE_CLIENT_ID not found in environment variables');
        }

        setDebugInfo('Calling initGoogleAuth...');
        await initGoogleAuth();
        
        setDebugInfo('Google Auth initialized successfully');
        setIsInitializing(false);

        // Try to render button if not using popup
        if (!usePopup && buttonRef.current && window.google?.accounts) {
          setDebugInfo('Rendering Google button...');
          renderGoogleButton();
        }
      } catch (err) {
        console.error('Google Auth initialization error:', err);
        setError(`Initialization failed: ${err.message}`);
        setDebugInfo(`Error: ${err.message}`);
        setIsInitializing(false);
        
        if (onError) {
          onError(err);
        }
      }
    };

    initializeGoogleAuth();
  }, [usePopup, onError, renderGoogleButton]);

  const handlePopupSignIn = async () => {
    setIsLoading(true);
    try {
      // For popup mode, use the One Tap prompt
      if (!window.google?.accounts) {
        throw new Error('Google Identity Services not loaded');
      }

      const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('One Tap not displayed, user may have dismissed it');
          setIsLoading(false);
        }
      });
    } catch (err) {
      console.error('Google popup sign in error:', err);
      showError(err.message || 'Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  const navigateBasedOnRole = (user) => {
    if (user?.role) {
      const role = user.role.toLowerCase();
      if (role === 'admin') {
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else if (role === 'tenant') {
        navigate(ROUTES.TENANT_DASHBOARD);
      } else if (role === 'property_manager' || role === 'propertymanager') {
        navigate(ROUTES.PM_DASHBOARD);
      } else if (role === 'landlord') {
        navigate(ROUTES.LANDLORD_DASHBOARD);
      } else {
        navigate(ROUTES.DASHBOARD);
      }
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  };

  // Show debug info in development
  if (import.meta.env.DEV && debugInfo) {
    console.log('GoogleAuthButton Debug:', debugInfo);
  }

  if (error) {
    return (
      <div className="w-full p-4 border border-red-300 rounded-md bg-red-50">
        <p className="text-sm text-red-600 text-center">{error}</p>
        <p className="text-xs text-red-400 text-center mt-1">Debug: {debugInfo}</p>
        <Button
          type="button"
          variant="outline"
          className="w-full mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="w-full">
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center space-x-2"
          disabled={true}
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
          Initializing Google Sign-In...
        </Button>
        {import.meta.env.DEV && (
          <p className="text-xs text-gray-500 text-center mt-1">Debug: {debugInfo}</p>
        )}
      </div>
    );
  }

  // If using popup mode, render a custom button
  if (usePopup) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center space-x-2"
        onClick={handlePopupSignIn}
        disabled={isLoading}
        loading={isLoading}
      >
        {!isLoading && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" className="mr-2">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        {text}
      </Button>
    );
  }

  // Otherwise, render the Google-provided button
  return (
    <div className="w-full relative">
      <div ref={buttonRef} className="w-full min-h-[40px] flex justify-center"></div>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
      {import.meta.env.DEV && (
        <p className="text-xs text-gray-500 text-center mt-1">Debug: {debugInfo}</p>
      )}
    </div>
  );
};

export default GoogleAuthButton;