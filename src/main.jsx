// frontend/src/main.jsx
console.log('--- MAIN JSX FILE LOADED ---'); // Add this line

console.log("Starting React app...");
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Import App component
import App from "./App.jsx";

// Import Context Providers - ensure correct paths with .jsx extension
import { AuthProvider } from "./contexts/AuthContext.jsx"; // Corrected path
import { PermissionProvider } from "./contexts/PermissionContext.jsx"; // Corrected path
import { NotificationProvider } from "./contexts/NotificationContext.jsx"; // Corrected path
import { GlobalAlertProvider } from "./contexts/GlobalAlertContext.jsx";   // Corrected path
import { PropertyProvider } from './contexts/PropertyContext.jsx'; // Corrected path
import { LeaseProvider } from './contexts/LeaseContext.jsx'; // Corrected path
import { RentProvider } from './contexts/RentContext.jsx'; // Corrected path


console.log("React is rendering...");
// Render the App

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {/* GlobalAlertProvider should be at the top to make its `showAlert` function available
        to other providers and components early. */}
    <GlobalAlertProvider>
      {/* AuthProvider should wrap components that rely on authentication state. */}
      <AuthProvider>
        {/* NotificationProvider depends on AuthProvider for user-specific notifications. */}
        <NotificationProvider>
          {/* PermissionProvider depends on AuthProvider for user role. */}
          <PermissionProvider>
            {/* PropertyProvider depends on AuthProvider for user's properties */}
            <PropertyProvider>
              {/* LeaseProvider depends on AuthProvider and PropertyProvider */}
              <LeaseProvider>
                {/* RentProvider depends on AuthProvider and LeaseProvider */}
                <RentProvider>
                  {/* BrowserRouter should wrap the main App components for routing. */}
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </RentProvider>
              </LeaseProvider>
            </PropertyProvider>
          </PermissionProvider>
        </NotificationProvider>
      </AuthProvider>
    </GlobalAlertProvider>
  </React.StrictMode>
);
