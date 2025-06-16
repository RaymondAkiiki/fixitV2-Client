// frontend/src/main.jsx

console.log("Starting React app...");
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Import App component
import App from "./App.jsx";

// Import Context Providers - ensure correct paths with .jsx extension
import { AuthProvider } from "./context/AuthContext.jsx";
import { PermissionProvider } from "./context/PermissionContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx"; // Re-added
import { GlobalAlertProvider } from "./context/GlobalAlertContext.jsx";   // Re-added

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
            {/* BrowserRouter should wrap the main App components for routing. */}
           
              <BrowserRouter>
                <App />
              </BrowserRouter>
           
          </PermissionProvider>
        </NotificationProvider>
      </AuthProvider>
    </GlobalAlertProvider>
  </React.StrictMode>
);

