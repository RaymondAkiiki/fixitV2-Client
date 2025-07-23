//client/src/App.jsx

import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Import ProtectedRoute and InitialRedirect
import ProtectedRoute, { InitialRedirect } from "./routes/ProtectedRoute.jsx";

// Import Constants
import { USER_ROLES, ROUTES } from "./utils/constants.js";

// Import Layout Components
import MainLayout from "./layout/MainLayout.jsx"; // For public/auth/error pages
import AdminLayout from './layout/AdminLayout.jsx';
import PropertyManagerLayout from './layout/PropertyManagerLayout.jsx';
import LandlordLayout from './layout/LandlordLayout.jsx';
import TenantLayout from './layout/TenantLayout.jsx';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

// Lazy load pages - Auth Pages
const WelcomePage = React.lazy(() => import("./pages/auth/WelcomePage.jsx"));
const LoginPage = React.lazy(() => import("./pages/auth/LoginPage.jsx"));
const RegisterPage = React.lazy(() => import("./pages/auth/RegisterPage.jsx"));
const ForgotPasswordPage = React.lazy(() => import("./pages/auth/ForgotPasswordPage.jsx"));
const SetPasswordPage = React.lazy(() => import('./pages/auth/SetPasswordPage.jsx'));
const EmailVerificationPage = React.lazy(() => import('./pages/auth/EmailVerificationPage')); 
const EmailVerifiedSuccessPage = React.lazy(() => import('./pages/auth/EmailVerifiedSuccessPage'));
const ResendVerificationPage = React.lazy(() => import('./pages/auth/ResendVerificationPage'));

// Public Pages (no authentication required)
const InviteAcceptancePage = React.lazy(() => import('./pages/public/InviteAcceptancePage.jsx'));
const PublicRequestViewPage = React.lazy(() => import('./pages/public/PublicRequestViewPage.jsx'));
const PublicScheduledMaintenanceViewPage = React.lazy(() => import("./pages/public/PublicScheduledMaintenanceViewPage.jsx"));

// Error Pages
const NotFoundPage = React.lazy(() => import("./pages/errors/NotFoundPage.jsx"));
const AccessDeniedPage = React.lazy(() => import("./pages/errors/AccessDeniedPage.jsx"));

//Admin components - Lazy loaded
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminDashboardPage.jsx'));
const AdminSystemPage = React.lazy(() => import('./pages/admin/AdminSystemPage.jsx'));
const AdminProfilePage = React.lazy(() => import('./pages/admin/AdminProfilePage.jsx'));
const AdminUserManagementPage = React.lazy(() => import('./pages/admin/AdminUserManagementPage'));
const AdminPropertyManagementPage = React.lazy(() => import('./pages/admin/AdminPropertyManagementPage'));
const AdminUnitManagementPage = React.lazy(() => import('./pages/admin/AdminUnitManagementPage'));
const AdminRequestManagementPage = React.lazy(() => import('./pages/admin/AdminRequestManagementPage'));
const AdminVendorManagementPage = React.lazy(() => import('./pages/admin/AdminVendorManagementPage'));
const AdminInviteManagementPage = React.lazy(() => import('./pages/admin/AdminInviteManagementPage'));
const AdminAuditLogPage = React.lazy(() => import('./pages/admin/AdminAuditLogPage'));
const AdminMediaManagementPage = React.lazy(() => import('./pages/admin/AdminMediaManagementPage'));
const AdminOnboardingManagementPage = React.lazy(() => import('./pages/admin/AdminOnboardingManagementPage'));
const AdminMessageManagementPage = React.lazy(() => import('./pages/admin/AdminMessageManagementPage'));
const AdminRentManagementPage = React.lazy(() => import('./pages/admin/AdminRentManagementPage'));
const AdminLeaseManagementPage = React.lazy(() => import('./pages/admin/AdminLeaseManagementPage'));
const AdminScheduledMaintenanceManagementPage = React.lazy(() => import('./pages/admin/AdminScheduledMaintenanceManagementPage'));
const AdminReportsManagementPage = React.lazy(() => import('./pages/admin/AdminReportsManagementPage.jsx'));

// General/Shared Feature Pages (used across multiple roles) - Lazy loaded
const PropertyListPage = React.lazy(() => import('./pages/properties/PropertyListPage.jsx'));
const PropertyDetailPage = React.lazy(() => import('./pages/properties/PropertyDetailPage.jsx'));
const PropertyFormPage = React.lazy(() => import('./pages/properties/PropertyFormPage.jsx'));
const UnitListPage = React.lazy(() => import('./pages/properties/UnitListPage.jsx')); // Units are nested under properties
const UnitDetailPage = React.lazy(() => import('./pages/properties/UnitDetailPage.jsx'));
const UnitFormPage = React.lazy(() => import('./pages/properties/UnitFormPage.jsx'));

const RequestListPage = React.lazy(() => import('./pages/requests/RequestListPage.jsx'));
const RequestDetailPage = React.lazy(() => import('./pages/requests/RequestDetailPage.jsx'));
const RequestFormPage = React.lazy(() => import('./pages/requests/RequestFormPage.jsx'));

const ScheduledMaintenanceListPage = React.lazy(() => import('./pages/scheduled-maintenance/ScheduledMaintenanceListPage.jsx'));
const ScheduledMaintenanceDetailPage = React.lazy(() => import('./pages/scheduled-maintenance/ScheduledMaintenanceDetailPage.jsx'));
const ScheduledMaintenanceFormPage = React.lazy(() => import('./pages/scheduled-maintenance/ScheduledMaintenanceFormPage.jsx'));

const VendorListPage = React.lazy(() => import('./pages/vendors/VendorListPage.jsx'));
const VendorDetailPage = React.lazy(() => import('./pages/vendors/VendorDetailPage.jsx'));
const VendorFormPage = React.lazy(() => import('./pages/vendors/VendorFormPage.jsx'));

const UserListPage = React.lazy(() => import('./pages/users/UserListPage.jsx'));
const UserDetailPage = React.lazy(() => import('./pages/users/UserDetailPage.jsx'));
import UserFormPage from './pages/users/UserFormPage.jsx';

import InviteListPage from './pages/invites/InviteListPage.jsx';
import InviteFormPage from './pages/invites/InviteFormPage.jsx';

import LeaseListPage from './pages/leases/LeaseListPage.jsx';
import LeaseDetailPage from './pages/leases/LeaseDetailPage.jsx';
import LeaseFormPage from './pages/leases/LeaseFormPage.jsx';

import PaymentListPage from './pages/payments/PaymentListPage.jsx';
import PaymentDetailPage from './pages/payments/PaymentDetailPage.jsx';
import PaymentFormPage from './pages/payments/PaymentFormPage.jsx';

import MessageListPage from './pages/messages/MessageListPage.jsx';
import MessageDetailPage from './pages/messages/MessageDetailPage.jsx';
import MessageComposePage from './pages/messages/MessageComposePage.jsx';

import NotificationListPage from './pages/notifications/NotificationListPage.jsx';

import OnboardingListPage from './pages/onboarding/OnboardingListPage.jsx';
import OnboardingDetailPage from './pages/onboarding/OnboardingDetailPage.jsx';
import OnboardingFormPage from './pages/onboarding/OnboardingFormPage.jsx';

import ReportsDashboardPage from './pages/reports/ReportsDashboardPage.jsx';
import MaintenanceReportsPage from './pages/reports/MaintenanceReportsPage.jsx';
import ScheduledMaintenanceReportsPage from './pages/reports/ScheduledMaintenanceReportsPage.jsx';
import VendorPerformanceReportsPage from './pages/reports/VendorPerformanceReportsPage.jsx';
import RentReportsPage from './pages/reports/RentReportsPage.jsx';

import AuditLogListPage from './pages/audit-logs/AuditLogListPage.jsx';

import MediaGalleryPage from './pages/media/MediaGalleryPage.jsx';

// Role-specific unique pages (dashboards, profiles)
import TenantDashboardPage from './pages/tenant/TenantDashboardPage.jsx';
import TenantProfilePage from './pages/tenant/TenantProfilePage.jsx';

import PMDashboardPage from './pages/pm/PMDashboardPage.jsx';
import PMProfilePage from './pages/pm/PMProfilePage.jsx';

import LandlordDashboardPage from './pages/landlord/LandlordDashboardPage.jsx';
import LandlordProfilePage from './pages/landlord/LandlordProfilePage.jsx';

// Other Extras (from your previous list)
import ComingSoon from "./pages/extras/ComingSoon.jsx";
import DemoPage from "./pages/extras/DemoPage.jsx";
import FeaturesPage from "./pages/extras/FeaturesPage.jsx";
import FeedbackPage from "./pages/extras/FeedbackPage.jsx";
import PricingPage from "./pages/extras/PricingPage.jsx";
import PrivacyPage from "./pages/extras/PrivacyPage.jsx";
import SupportPage from "./pages/extras/SupportPage.jsx";
import TermsPage from "./pages/extras/TermsPage.jsx";
import TestPage from "./pages/extras/TestPage.jsx";
import TestPage2 from "./pages/extras/TestPage2.jsx";

const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
      {/* Initial Redirect: Handles redirection based on auth status and role */}
      <Route path={ROUTES.HOME} element={<InitialRedirect />} />

      {/* Public/Auth Routes: These routes do not require authentication */}
      <Route element={<MainLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<SetPasswordPage />} /> {/* e.g., /reset-password/:token */}
        <Route path={ROUTES.ACCEPT_INVITE} element={<InviteAcceptancePage />} /> {/* e.g., /invite/:token */}

        {/* Public view pages for external users (e.g., vendors) */}
        <Route path="/public/requests/:publicToken" element={<PublicRequestViewPage />} />
        <Route path="/public/scheduled-maintenance/:publicToken" element={<PublicScheduledMaintenanceViewPage />} />
        <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
        <Route path="/email-verified-success" element={<EmailVerifiedSuccessPage />} />
        <Route path="/resend-verification" element={<ResendVerificationPage />} />   

        {/* General Marketing/Info Pages */}
        <Route path="/welcome" element={<WelcomePage />} /> {/* Explicit welcome page */}
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

      {/* Protected Routes for Admin */}
      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
        <Route path={ROUTES.ADMIN_BASE} element={<AdminLayout />}>
            {/* The index route now correctly redirects from /admin to /admin/dashboard */}
            <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="system" element={<AdminSystemPage />} />

            {/* Feature-based pages accessible by Admin */}
            <Route path="users" element={<AdminUserManagementPage />} />
            <Route path="users/:userId" element={<UserDetailPage />} />
            <Route path="users/add" element={<UserFormPage />} /> {/* Admin can add/edit users */}
            <Route path="users/edit/:userId" element={<UserFormPage />} />

            <Route path="properties" element={<AdminPropertyManagementPage />} />
            <Route path="properties/:propertyId" element={<PropertyDetailPage />} />
            <Route path="properties/add" element={<PropertyFormPage />} />
            <Route path="properties/edit/:propertyId" element={<PropertyFormPage />} />
            <Route path="properties/:propertyId/units" element={<UnitListPage />} /> {/* Units nested under properties */}
            <Route path="properties/:propertyId/units/:unitId" element={<UnitDetailPage />} />
            <Route path="properties/:propertyId/units/add" element={<UnitFormPage />} />
            <Route path="properties/:propertyId/units/edit/:unitId" element={<UnitFormPage />} />
            <Route path="units" element={<AdminUnitManagementPage />} />

            <Route path="requests" element={<AdminRequestManagementPage />} />
            <Route path="requests/:requestId" element={<RequestDetailPage />} />
            <Route path="requests/add" element={<RequestFormPage />} />
            <Route path="requests/edit/:requestId" element={<RequestFormPage />} />

            <Route path="scheduled-maintenance" element={<AdminScheduledMaintenanceManagementPage />} />
            <Route path="scheduled-maintenance/:taskId" element={<ScheduledMaintenanceDetailPage />} />
            <Route path="scheduled-maintenance/add" element={<ScheduledMaintenanceFormPage />} />
            <Route path="scheduled-maintenance/edit/:taskId" element={<ScheduledMaintenanceFormPage />} />

            <Route path="vendors" element={<AdminVendorManagementPage />} />
            <Route path="vendors/:vendorId" element={<VendorDetailPage />} />
            <Route path="vendors/add" element={<VendorFormPage />} />
            <Route path="vendors/edit/:vendorId" element={<VendorFormPage />} />

            <Route path="invites" element={<AdminInviteManagementPage />} />
            <Route path="invites/send" element={<InviteFormPage />} /> {/* Admin can send invites */}

            <Route path="leases" element={<AdminLeaseManagementPage />} />
            <Route path="leases/:leaseId" element={<LeaseDetailPage />} />
            <Route path="leases/add" element={<LeaseFormPage />} />
            <Route path="leases/edit/:leaseId" element={<LeaseFormPage />} />

            <Route path="payments" element={<AdminRentManagementPage />} />
            <Route path="payments/:paymentId" element={<PaymentDetailPage />} />
            <Route path="payments/record" element={<PaymentFormPage />} /> {/* Admin can record payments */}

            <Route path="messages" element={<AdminMessageManagementPage />} />
            <Route path="messages/:messageId" element={<MessageDetailPage />} />
            <Route path="messages/compose" element={<MessageComposePage />} />

            <Route path="notifications" element={<NotificationListPage />} />

            <Route path="onboarding" element={<AdminOnboardingManagementPage />} />
            <Route path="onboarding/:onboardingId" element={<OnboardingDetailPage />} />
            <Route path="onboarding/add" element={<OnboardingFormPage />} />
            <Route path="onboarding/edit/:onboardingId" element={<OnboardingFormPage />} />

            <Route path="reports" element={<AdminReportsManagementPage />} />
            <Route path="reports/maintenance" element={<MaintenanceReportsPage />} />
            <Route path="reports/scheduled-maintenance" element={<ScheduledMaintenanceReportsPage />} />
            <Route path="reports/vendor-performance" element={<VendorPerformanceReportsPage />} />
            <Route path="reports/rent" element={<RentReportsPage />} />

            <Route path="audit-logs" element={<AdminAuditLogPage />} />
            <Route path="media" element={<AdminMediaManagementPage />} />
       </Route>
      </Route>

       {/* Protected Routes for Property Manager */}
      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.PROPERTY_MANAGER, USER_ROLES.ADMIN]} />}>
          <Route path="/pm" element={<PropertyManagerLayout />}>
              <Route index element={<Navigate to={ROUTES.PM_DASHBOARD} replace />} />
              <Route path="dashboard" element={<PMDashboardPage />} />
              <Route path="profile" element={<PMProfilePage />} />
                    
              {/* Feature-based pages accessible by PM */}
              <Route path="users" element={<UserListPage />} /> {/* PM can manage users associated with their properties */}
              <Route path="users/:userId" element={<UserDetailPage />} />
              <Route path="users/add" element={<UserFormPage />} />
              <Route path="users/edit/:userId" element={<UserFormPage />} />

              <Route path="properties" element={<PropertyListPage />} />
              <Route path="properties/:propertyId" element={<PropertyDetailPage />} />
              <Route path="properties/add" element={<PropertyFormPage />} />
              <Route path="properties/edit/:propertyId" element={<PropertyFormPage />} />
              <Route path="properties/:propertyId/units" element={<UnitListPage />} />
              <Route path="properties/:propertyId/units/:unitId" element={<UnitDetailPage />} />
              <Route path="properties/:propertyId/units/add" element={<UnitFormPage />} />
              <Route path="properties/:propertyId/units/edit/:unitId" element={<UnitFormPage />} />

              <Route path="requests" element={<RequestListPage />} />
              <Route path="requests/:requestId" element={<RequestDetailPage />} />
              <Route path="requests/add" element={<RequestFormPage />} />
              <Route path="requests/edit/:requestId" element={<RequestFormPage />} />

              <Route path="scheduled-maintenance" element={<ScheduledMaintenanceListPage />} />
              <Route path="scheduled-maintenance/:taskId" element={<ScheduledMaintenanceDetailPage />} />
              <Route path="scheduled-maintenance/add" element={<ScheduledMaintenanceFormPage />} />
              <Route path="scheduled-maintenance/edit/:taskId" element={<ScheduledMaintenanceFormPage />} />

              <Route path="vendors" element={<VendorListPage />} />
              <Route path="vendors/:vendorId" element={<VendorDetailPage />} />
              <Route path="vendors/add" element={<VendorFormPage />} />
              <Route path="vendors/edit/:vendorId" element={<VendorFormPage />} />

              <Route path="invites" element={<InviteListPage />} />
              <Route path="invites/send" element={<InviteFormPage />} />

              <Route path="leases" element={<LeaseListPage />} />
              <Route path="leases/:leaseId" element={<LeaseDetailPage />} />
              <Route path="leases/add" element={<LeaseFormPage />} />
              <Route path="leases/edit/:leaseId" element={<LeaseFormPage />} />

              <Route path="payments" element={<PaymentListPage />} />
              <Route path="payments/:paymentId" element={<PaymentDetailPage />} />
              <Route path="payments/record" element={<PaymentFormPage />} />

              <Route path="messages" element={<MessageListPage />} />
              <Route path="messages/:messageId" element={<MessageDetailPage />} />
              <Route path="messages/compose" element={<MessageComposePage />} />

              <Route path="notifications" element={<NotificationListPage />} />

              <Route path="onboarding" element={<OnboardingListPage />} />
              <Route path="onboarding/:onboardingId" element={<OnboardingDetailPage />} />
              <Route path="onboarding/add" element={<OnboardingFormPage />} />
              <Route path="onboarding/edit/:onboardingId" element={<OnboardingFormPage />} />

              <Route path="reports" element={<ReportsDashboardPage />} />
              <Route path="reports/maintenance" element={<MaintenanceReportsPage />} />
              <Route path="reports/scheduled-maintenance" element={<ScheduledMaintenanceReportsPage />} />
              <Route path="reports/vendor-performance" element={<VendorPerformanceReportsPage />} />
              <Route path="reports/rent" element={<RentReportsPage />} />
          </Route>
      </Route>

       {/* Protected Routes for Landlord (Now using the correct pattern) */}
      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.LANDLORD, USER_ROLES.ADMIN]} />}>
        <Route path="/landlord" element={<LandlordLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<LandlordDashboardPage />} />
          <Route path="profile" element={<LandlordProfilePage />} />

          {/* Feature-based pages accessible by Landlord */}
          <Route path="users" element={<UserListPage />} /> {/* Landlord can manage users associated with their properties */}
          <Route path="users/:userId" element={<UserDetailPage />} />
          <Route path="users/add" element={<UserFormPage />} />
          <Route path="users/edit/:userId" element={<UserFormPage />} />

          <Route path="properties" element={<PropertyListPage />} />
          <Route path="properties/:propertyId" element={<PropertyDetailPage />} />
          <Route path="properties/add" element={<PropertyFormPage />} />
          <Route path="properties/edit/:propertyId" element={<PropertyFormPage />} />
          <Route path="properties/:propertyId/units" element={<UnitListPage />} />
          <Route path="properties/:propertyId/units/:unitId" element={<UnitDetailPage />} />
          <Route path="properties/:propertyId/units/add" element={<UnitFormPage />} />
          <Route path="properties/:propertyId/units/edit/:unitId" element={<UnitFormPage />} />

          <Route path="requests" element={<RequestListPage />} />
          <Route path="requests/:requestId" element={<RequestDetailPage />} />
          <Route path="requests/add" element={<RequestFormPage />} />
          <Route path="requests/edit/:requestId" element={<RequestFormPage />} />

          <Route path="scheduled-maintenance" element={<ScheduledMaintenanceListPage />} />
          <Route path="scheduled-maintenance/:taskId" element={<ScheduledMaintenanceDetailPage />} />
          <Route path="scheduled-maintenance/add" element={<ScheduledMaintenanceFormPage />} />
          <Route path="scheduled-maintenance/edit/:taskId" element={<ScheduledMaintenanceFormPage />} />

          <Route path="vendors" element={<VendorListPage />} />
          <Route path="vendors/:vendorId" element={<VendorDetailPage />} />
          <Route path="vendors/add" element={<VendorFormPage />} />
          <Route path="vendors/edit/:vendorId" element={<VendorFormPage />} />

          <Route path="invites" element={<InviteListPage />} />
          <Route path="invites/send" element={<InviteFormPage />} />

          <Route path="leases" element={<LeaseListPage />} />
          <Route path="leases/:leaseId" element={<LeaseDetailPage />} />
          <Route path="leases/add" element={<LeaseFormPage />} />
          <Route path="leases/edit/:leaseId" element={<LeaseFormPage />} />

          <Route path="payments" element={<PaymentListPage />} />
          <Route path="payments/:paymentId" element={<PaymentDetailPage />} />
          <Route path="payments/record" element={<PaymentFormPage />} />

          <Route path="messages" element={<MessageListPage />} />
          <Route path="messages/:messageId" element={<MessageDetailPage />} />
          <Route path="messages/compose" element={<MessageComposePage />} />

          <Route path="notifications" element={<NotificationListPage />} />
          <Route path="media" element={<MediaGalleryPage />} />
          

          <Route path="onboarding" element={<OnboardingListPage />} />
          <Route path="onboarding/:onboardingId" element={<OnboardingDetailPage />} />
          <Route path="onboarding/add" element={<OnboardingFormPage />} />
          <Route path="onboarding/edit/:onboardingId" element={<OnboardingFormPage />} />

          <Route path="reports" element={<ReportsDashboardPage />} />
          <Route path="reports/maintenance" element={<MaintenanceReportsPage />} />
          <Route path="reports/scheduled-maintenance" element={<ScheduledMaintenanceReportsPage />} />
          <Route path="reports/vendor-performance" element={<VendorPerformanceReportsPage />} />
          <Route path="reports/rent" element={<RentReportsPage />} />
        </Route>
      </Route>

      {/* Protected Routes for Tenant (Now using the correct pattern) */}
      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.TENANT]} />}>
        <Route path="/tenant" element={<TenantLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TenantDashboardPage />} />
            <Route path="profile" element={<TenantProfilePage />} />

            {/* Feature-based pages accessible by Tenant */}
            <Route path="requests" element={<RequestListPage />} /> {/* Tenants can see their own requests */}
            <Route path="requests/:requestId" element={<RequestDetailPage />} />
            <Route path="requests/add" element={<RequestFormPage />} /> {/* Tenants can add requests */}

            <Route path="my-unit" element={<UnitDetailPage />} /> {/* Tenant's specific unit details */}

            <Route path="scheduled-maintenance" element={<ScheduledMaintenanceListPage />} /> {/* Tenants can view scheduled maintenance for their unit/property */}
            <Route path="scheduled-maintenance/:taskId" element={<ScheduledMaintenanceDetailPage />} />

            <Route path="messages" element={<MessageListPage />} />
            <Route path="messages/:messageId" element={<MessageDetailPage />} />
            <Route path="messages/compose" element={<MessageComposePage />} />

            <Route path="notifications" element={<NotificationListPage />} />

            <Route path="onboarding" element={<OnboardingListPage />} />
            <Route path="onboarding/:onboardingId" element={<OnboardingDetailPage />} />
            {/* Tenants can't add/edit onboarding forms, only view/complete */}
        </Route>
      </Route>

      {/* Catch-all for 404 or access denied */}
      <Route element={<MainLayout />}>
        <Route path={ROUTES.ACCESS_DENIED} element={<AccessDeniedPage />} />
        <Route path="/403" element={<AccessDeniedPage />} /> {/* Alias for access denied */}
        <Route path="*" element={<NotFoundPage />} /> {/* Fallback for any unmatched route */}
      </Route>
    </Routes>
    </Suspense>
  );
};

export default App;
