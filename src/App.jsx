import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate  } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Admin components
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUserManagementPage from './pages/admin/AdminUserManagementPage';
import AdminPropertyManagementPage from './pages/admin/AdminPropertyManagementPage';
import AdminUnitManagementPage from './pages/admin/AdminUnitManagementPage';
import AdminRequestManagementPage from './pages/admin/AdminRequestManagementPage';
import AdminVendorManagementPage from './pages/admin/AdminVendorManagementPage';
import AdminInviteManagementPage from './pages/admin/AdminInviteManagementPage';
import AdminAuditLogPage from './pages/admin/AdminAuditLogPage';
import AdminSystemPage from './pages/admin/AdminSystemPage';
import AdminMediaManagementPage from './pages/admin/AdminMediaManagementPage';

// Auth Pages
import WelcomePage from "./pages/auth/WelcomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import AcceptInvitePage from './pages/auth/AcceptInvitePage';
import InviteAcceptancePage from './pages/auth/InviteAcceptancePage'; // NEW
import PublicRequestViewPage from './pages/public/PublicRequestViewPage'; // NEW
import SetPasswordPage from './pages/auth/SetPasswordPage';

// Error Pages
import NotFoundPage from "./pages/errors/NotFoundPage";
import AccessDeniedPage from "./pages/errors/AccessDeniedPage";

// Extras
import DemoPage from "./pages/extras/DemoPage";
import TestPage from "./pages/extras/TestPage";
import TestPage2 from "./pages/extras/TestPage2";
import ComingSoon from "./pages/extras/ComingSoon";
import { FeaturesPage } from "./pages/extras/FeaturesPage";
import { PricingPage } from "./pages/extras/PricingPage";
import { SupportPage } from "./pages/extras/SupportPage";
import TermsPage from "./pages/extras/TermsPage";
import PrivacyPage from "./pages/extras/PrivacyPage";
import FeedbackPage from "./pages/extras/FeedbackPage";

// Landlords
import LandlordDashboard from "./pages/landlord/LandlordDashboard";
import PropertyManagementPage from './pages/landlord/PropertyManagementPage';
import PropertyDetailsPage from './pages/landlord/PropertyDetailsPage';
import RequestManagementPage from './pages/landlord/RequestManagementPage';
import RequestDetailPage from './pages/landlord/RequestDetailPage';
import TenantManagementPage from './pages/landlord/TenantManagementPage';// For PMs to manage tenants
import TenantDetailPage from './pages/landlord/TenantDetailPage';
import VendorManagementPage from './pages/landlord/VendorManagementPage';
import VendorDetailPage from './pages/landlord/VendorDetailsPage';
import InviteManagementPage from './pages/landlord/InviteManagementPage';
import ReportsPage from './pages/landlord/ReportsPage';
import LandlordProfile from './pages/landlord/LandlordProfile';
import CreateEditPropertyPage from './pages/landlord/CreateEditPropertyPage';
import CreateEditRequestPage from './pages/landlord/CreateEditRequestPage';
import CreateEditScheduledMaintenancePage from './pages/landlord/CreateEditScheduledMaintenancePage';
import ScheduledMaintenanceManagementPage from './pages/landlord/ScheduledMaintenanceManagementPage';
import CreateEditVendorPage from './pages/landlord/CreateEditVendorPage';
import NotificationPage from "./pages/landlord/NotificationPage";

// Import PM Pages
import PMDashboard from './pages/pm/PMDashboard';
import PMPropertyManagementPage from './pages/pm/PMPropertyManagementPage';
import PMPropertyDetailsPage from './pages/pm/PMPropertyDetailsPage';
import PMRequestManagementPage from './pages/pm/PMRequestManagementPage';
import PMRequestDetailPage from './pages/pm/PMRequestDetailPage'; // A new page for viewing one request
import PMScheduledMaintenanceManagementPage from './pages/pm/PMScheduledMaintenanceManagementPage';
import PMVendorManagementPage from './pages/pm/PMVendorManagementPage';
import PMInviteManagementPage from './pages/pm/PMInviteManagementPage';
import PMReportsPage from './pages/pm/PMReportsPage'; // A new page for reports
import PMTenantManagementPage from './pages/pm/PMTenantManagementPage';// For PMs to manage tenants
import PMTenantDetailPage from './pages/pm/PMTenantDetailPage';
import PMCreateEditPropertyPage from './pages/pm/PMCreateEditPropertyPage';
import PMCreateEditRequestPage from './pages/pm/PMCreateEditRequestPage';
import PMCreateEditScheduledMaintenancePage from './pages/pm/PMCreateEditScheduledMaintenancePage';
import PMCreateEditVendorPage from './pages/pm/PMCreateEditVendorPage';
import PMVendorDetailPage from './pages/pm/PMVendorDetailsPage';
import PMProfile from './pages/pm/PMProfile'; 
import PMNotificationPage from "./pages/pm/PMNotificationPage";

// Import Tenant Pages
import TenantDashboard from './pages/tenant/TenantDashboard';
import MyRequestsPage from './pages/tenant/MyRequestsPage';
import AddRequestPage from './pages/tenant/AddRequestPage';
import MyUnitPage from './pages/tenant/MyUnitPage';
import TNotificationPage from './pages/tenant/TNotificationPage';
import TenantProfile from './pages/tenant/TenantProfile';
import ScheduledWorksPage from './pages/tenant/ScheduledWorksPage';


// Layout...reviewed
import MainLayout from "./components/layout/MainLayout";
import ExtrasMainLayout from "./components/layout/ExtrasMainLayout";
import PropertyManagerLayout from './components/layout/PropertyManagerLayout';
import TenantLayout from './components/layout/TenantLayout';
import LandlordLayout from './components/layout/LandlordLayout';
import AdminLayout from './components/layout/AdminLayout';
import Spinner from './components/common/Spinner';
import DashboardFilters from "./components/common/DashboardFilters";
import PublicScheduledMaintenanceViewPage from "./pages/public/PublicScheduledMaintenanceViewPage";

// Protect ...reviewed
import ProtectedRoute from "./routes/ProtectedRoute";


const App = () => {
  return (     
    <Routes>

      {/* Auth Routes */}
      <Route element={<ExtrasMainLayout />}>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="/accept-invite/:inviteToken" element={<InviteAcceptancePage />} />
        <Route path="/reset-password/:token" element={<SetPasswordPage />} />
      </Route>

      {/* Extras */}
      <Route element={<ExtrasMainLayout />}>
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/test2" element={<TestPage2 />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />       
      </Route>

      {/* PM Routes */}
      <Route path="/pm" element={<PropertyManagerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PMDashboard />} />
        <Route path="properties" element={<PMPropertyManagementPage />} />
        <Route path="properties/:propertyId" element={<PMPropertyDetailsPage />} />
        <Route path="properties/add" element={<PMCreateEditPropertyPage />} />
        <Route path="properties/edit/:propertyId" element={<PMCreateEditPropertyPage />} />
        <Route path="requests" element={<PMRequestManagementPage />} />
        <Route path="requests/:requestId" element={<PMRequestDetailPage />} />
        <Route path="requests/add" element={<PMCreateEditRequestPage />} />
        <Route path="requests/edit/:requestId" element={<PMCreateEditRequestPage />} />
        <Route path="scheduled-maintenance" element={<PMScheduledMaintenanceManagementPage />} />
        <Route path="scheduled-maintenance/add" element={<PMCreateEditScheduledMaintenancePage />} />
        <Route path="scheduled-maintenance/edit/:taskId" element={<PMCreateEditScheduledMaintenancePage />} />
        {/* <Route path="scheduled-maintenance/:taskId" element={<MaintenanceDetailPage />} /> */}
        <Route path="vendors" element={<PMVendorManagementPage />} />
        <Route path="vendors/add" element={<PMCreateEditVendorPage />} />
        <Route path="vendors/edit/:vendorId" element={<PMCreateEditVendorPage />} />
        {/* <Route path="vendors/:vendorId" element={<VendorDetailPage />} /> */}
        <Route path="invites" element={<PMInviteManagementPage />} />
        <Route path="tenants" element={<PMTenantManagementPage />} />
        <Route path="properties/:propertyId/tenants/:tenantId" element={<PMTenantDetailPage />} />
        <Route path="reports" element={<PMReportsPage />} />
        <Route path="profile" element={<PMProfile />} />
        <Route path="notifications" element={<PMNotificationPage />} />
        
      </Route>

      {/* Tenant Routes */}
      <Route path="/tenant" element={<TenantLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TenantDashboard />} />
        <Route path="requests" element={<MyRequestsPage />} />
        <Route path="requests/add" element={<AddRequestPage />} />
        {/* You would also have a details page like /requests/:id */}
        <Route path="my-unit" element={<MyUnitPage />} />
        <Route path="notifications" element={<TNotificationPage />} />
        <Route path="profile" element={<TenantProfile />} />
        <Route path="scheduled-maintenance" element={<ScheduledWorksPage />} />    
        {/* ... other tenant routes */}
      </Route>

      {/* Landlord Routes */}
      <Route path="/landlord" element={<LandlordLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<LandlordDashboard />} />
        <Route path="properties" element={<PropertyManagementPage />} />
        <Route path="properties/:propertyId" element={<PropertyDetailsPage />} />
        <Route path="properties/add" element={<CreateEditPropertyPage />} />
        <Route path="properties/edit/:propertyId" element={<CreateEditPropertyPage />} />
        <Route path="requests" element={<RequestManagementPage />} />
        <Route path="requests/:requestId" element={<RequestDetailPage />} />
        <Route path="requests/add" element={<CreateEditRequestPage />} />
        <Route path="requests/edit/:requestId" element={<CreateEditRequestPage />} />
        <Route path="scheduled-maintenance" element={<ScheduledMaintenanceManagementPage />} />
        <Route path="scheduled-maintenance/add" element={<CreateEditScheduledMaintenancePage />} />
        <Route path="scheduled-maintenance/edit/:taskId" element={<CreateEditScheduledMaintenancePage />} />
        {/* <Route path="scheduled-maintenance/:taskId" element={<MaintenanceDetailPage />} /> */}
        <Route path="tenants" element={<TenantManagementPage />} />
        <Route path="properties/:propertyId/tenants/:tenantId" element={<TenantDetailPage />} />
        <Route path="vendors" element={<VendorManagementPage />} />
        <Route path="vendors/add" element={<CreateEditVendorPage />} />
        <Route path="vendors/edit/:vendorId" element={<CreateEditVendorPage />} />
        {/* <Route path="vendors/:vendorId" element={<VendorDetailPage />} /> */}
        <Route path="invites" element={<InviteManagementPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="profile" element={<LandlordProfile />} />
        <Route path="notifications" element={<NotificationPage />} />
      </Route>

      {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}> {/* Use 'Admin' or 'admin' as per your role string */}
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUserManagementPage />} />
          <Route path="properties" element={<AdminPropertyManagementPage />} />
          <Route path="units" element={<AdminUnitManagementPage />} />
          <Route path="requests" element={<AdminRequestManagementPage />} />
          <Route path="vendors" element={<AdminVendorManagementPage />} />
          <Route path="invites" element={<AdminInviteManagementPage />} />
          <Route path="audit-logs" element={<AdminAuditLogPage />} />
          <Route path="system" element={<AdminSystemPage />} />
          <Route path="media" element={<AdminMediaManagementPage />} />
          <Route index element={<Navigate to="dashboard" replace />} /> {/* Default admin page */}
        </Route>

      {/* Misc Errors */}
      <Route element={<ExtrasMainLayout />}>
        <Route path="/public/scheduled-maintenance/:publicToken" element={<PublicScheduledMaintenanceViewPage />} />
        <Route path="/public/requests/:publicToken" element={<PublicRequestViewPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route path="/403" element={<AccessDeniedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>      
  );
};

export default App;