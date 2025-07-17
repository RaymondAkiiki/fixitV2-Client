

      {/* Protected Routes for Property Manager */}
      <Route
        path="/pm"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.PROPERTY_MANAGER, USER_ROLES.ADMIN]}>
            <PropertyManagerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.PM_DASHBOARD.split('/')[2]} replace />} /> {/* Navigate to "dashboard" */}
        <Route path={ROUTES.PM_DASHBOARD.split('/')[2]} element={<PMDashboard />} />
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
        <Route path="vendors" element={<PMVendorManagementPage />} />
        <Route path="vendors/add" element={<PMCreateEditVendorPage />} />
        <Route path="vendors/edit/:vendorId" element={<PMCreateEditVendorPage />} />
        <Route path="invites" element={<PMInviteManagementPage />} />
        <Route path="tenants" element={<PMTenantManagementPage />} />
        <Route path="properties/:propertyId/tenants/:tenantId" element={<PMTenantDetailPage />} />
        <Route path="reports" element={<PMReportsPage />} />
        <Route path="profile" element={<PMProfile />} />
        <Route path="notifications" element={<NotificationPage />} /> {/* Use general NotificationPage */}
        {/* Add other PM specific nested routes here */}
        <Route path="leases" element={<LeasePage />} /> 
        <Route path="payments" element={<PaymentPage />} /> 
        <Route path="messages" element={<MessagePage />} /> 
        <Route path="onboarding" element={<OnboardingPage />} /> 
        <Route path="training" element={<TrainingPage />} /> 
        <Route path="upload" element={<FileUploader />} /> 
      </Route>

      {/* Protected Routes for Tenant */}
      <Route
        path="/tenant"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.TENANT]}>
            <TenantLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.TENANT_DASHBOARD.split('/')[2]} replace />} />
        <Route path={ROUTES.TENANT_DASHBOARD.split('/')[2]} element={<TenantDashboard />} />
        <Route path="requests" element={<MyRequestsPage />} />
        <Route path="requests/add" element={<AddRequestPage />} />
        <Route path="requests/:requestId" element={<PMRequestDetailPage />} /> {/* Tenant can view their own request details */}
        <Route path="my-unit" element={<MyUnitPage />} />
        <Route path="notifications" element={<NotificationPage />} /> {/* Use general NotificationPage */}
        <Route path="profile" element={<TenantProfile />} />
        <Route path="scheduled-maintenance" element={<ScheduledWorksPage />} />
        {/* Add other Tenant specific nested routes here */}
        <Route path="messages" element={<MessagePage />} /> {/* Example of shared page within Tenant layout */}
        <Route path="onboarding" element={<OnboardingPage />} /> {/* Example of shared page within Tenant layout */}
      </Route>

      {/* Protected Routes for Landlord */}
      <Route
        path="/landlord"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.LANDLORD, USER_ROLES.ADMIN]}>
            <LandlordLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.LANDLORD_DASHBOARD.split('/')[2]} replace />} />
        <Route path={ROUTES.LANDLORD_DASHBOARD.split('/')[2]} element={<LandlordDashboard />} />
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
        <Route path="tenants" element={<TenantManagementPage />} />
        <Route path="properties/:propertyId/tenants/:tenantId" element={<TenantDetailPage />} />
        <Route path="vendors" element={<VendorManagementPage />} />
        <Route path="vendors/add" element={<CreateEditVendorPage />} />
        <Route path="vendors/edit/:vendorId" element={<CreateEditVendorPage />} />
        <Route path="invites" element={<InviteManagementPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="profile" element={<LandlordProfile />} />
        <Route path="notifications" element={<NotificationPage />} /> {/* Use general NotificationPage */}
        {/* Add other Landlord specific nested routes here */}
        <Route path="leases" element={<LeasePage />} /> {/* Example of shared page within Landlord layout */}
        <Route path="payments" element={<PaymentPage />} /> {/* Example of shared page within Landlord layout */}
        <Route path="messages" element={<MessagePage />} /> {/* Example of shared page within Landlord layout */}
        <Route path="onboarding" element={<OnboardingPage />} /> {/* Example of shared page within Landlord layout */}
        <Route path="training" element={<TrainingPage />} /> {/* Example of shared page within Landlord layout */}
        <Route path="upload" element={<FileUploader />} /> {/* Example of shared page within Landlord layout */}
      </Route>

      {/* Protected Routes for Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.ADMIN_DASHBOARD.split('/')[2]} replace />} />
        <Route path={ROUTES.ADMIN_DASHBOARD.split('/')[2]} element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUserManagementPage />} />
        <Route path="properties" element={<AdminPropertyManagementPage />} />
        <Route path="units" element={<AdminUnitManagementPage />} />
        <Route path="requests" element={<AdminRequestManagementPage />} />
        <Route path="vendors" element={<AdminVendorManagementPage />} />
        <Route path="invites" element={<AdminInviteManagementPage />} />
        <Route path="audit-logs" element={<AdminAuditLogPage />} />
        <Route path="system" element={<AdminSystemPage />} />
        <Route path="media" element={<AdminMediaManagementPage />} />
        {/* Admin can access all general authenticated pages too */}
        <Route path="leases" element={<LeasePage />} />
        <Route path="payments" element={<PaymentPage />} />
        <Route path="messages" element={<MessagePage />} />
        <Route path="notifications" element={<NotificationPage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="training" element={<TrainingPage />} />
        <Route path="upload" element={<FileUploader />} />
      </Route> 

