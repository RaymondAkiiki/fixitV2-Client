// frontend/src/main.jsx
console.log('--- MAIN JSX FILE LOADED ---');

console.log("Starting React app...");
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Import App component
import App from "./App.jsx";

// Import Context Providers
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { PermissionProvider } from "./contexts/PermissionContext.jsx";
import { NotificationProvider } from "./contexts/NotificationContext.jsx";
import { GlobalAlertProvider } from "./contexts/GlobalAlertContext.jsx";
import { QueryProvider } from "./contexts/QueryProvider.jsx";
import { RouteProvider } from "./contexts/RouteContext";

console.log("React is rendering...");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GlobalAlertProvider>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <PermissionProvider>
              <RouteProvider>
                <QueryProvider>
                  <App />
                </QueryProvider>
              </RouteProvider>
            </PermissionProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </GlobalAlertProvider>
  </React.StrictMode>
);