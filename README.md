# Fixit Frontend

**Fixit** is a modern property management platform frontend, built with **React**, **Vite**, and **Tailwind CSS**. This project provides a comprehensive UI for property managers, landlords, tenants, vendors, and administrators to manage properties, units, maintenance requests, scheduled maintenance, users, notifications, reports, and more.

---

## Features

- **Role-Based Dashboards** for Admin, Landlord, Property Manager, Tenant
- **Authentication & Authorization** (JWT-based, roles/permissions)
- **Property & Unit Management** (CRUD for properties, units, tenants, vendors)
- **Maintenance Requests** (submit, view, assign, resolve, feedback)
- **Scheduled Maintenance** (create, edit, view recurring tasks)
- **User Management** (profile, edit, admin user management)
- **Notifications** (list, view, mark as read)
- **Reports & Export** (generate and download data)
- **Audit Logs** (admin)
- **Responsive UI** (Sidebar, Navbar, Footer, layouts)
- **Modern API Integration** (Axios, async/await, interceptors)

---

## Tech Stack

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router v7](https://reactrouter.com/)
- [Axios](https://axios-http.com/)
- [React Context API](https://react.dev/reference/react/useContext)
- [React Toastify](https://fkhadra.github.io/react-toastify/)
- [Lucide React Icons](https://lucide.dev/)
- [ESLint + Prettier](https://eslint.org/), [PostCSS](https://postcss.org/)

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x

### Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/your-username/fixit-frontend.git
   cd fixit-frontend
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Setup environment variables**

   Create a `.env` file in the root directory:
   ```
   VITE_API_BASE_URL=http://localhost:5000
   VITE_ADMIN_TOKEN=your_admin_jwt # (for dev/admin only)
   ```

4. **Start the development server**
   ```sh
   npm run dev
   ```

   The app will be running at [http://localhost:5173](http://localhost:5173) by default.

---

## Project Structure

```
src/
  api/               # Axios instance
  components/        # Layout, Sidebar, Navbar, Footer, UI components
  context/           # React Contexts (Auth, Permission)
  pages/
    auth/            # Login, Register, etc.
    dashboard/       # Dashboards for each role
    properties/      # Property CRUD pages
    tenants/         # Tenant CRUD pages
    units/           # Unit CRUD pages
    vendors/         # Vendor CRUD pages
    requests/        # Maintenance requests
    maintenance/     # Scheduled maintenance
    users/           # User profile, editing, admin users
    reports/         # Reports, export
    notifications/   # Notification pages
    admin/           # Audit log, admin tools
    errors/          # 404, 403 pages
    extras/          # Terms, Privacy, etc.
  services/          # API service functions
  routes/            # ProtectedRoute, custom routing logic
  index.css          # Tailwind and custom styles
  main.jsx           # React entry point
```

---

## Environment Variables

| Name                | Description                          |
|---------------------|--------------------------------------|
| VITE_API_BASE_URL   | Backend API base URL (no trailing slash) |
| VITE_ADMIN_TOKEN    | Admin JWT token for admin API (optional, dev only) |

---

## Usage Notes

- **Role-based access:** Certain pages and actions require specific user roles.
- **API integration:** Make sure your backend API (Fixit backend) is running and accessible at the URL specified in `VITE_API_BASE_URL`.
- **Authentication:** JWT-based; tokens are stored in localStorage and sent via Axios interceptors.
- **Styling:** Tailwind CSS utility classes are used throughout for rapid UI development.
- **Customizing:** You can modify navigation items, dashboard widgets, and page layouts in the respective files in `src/components` and `src/pages`.

---

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a pull request

---

## License

[ISC](LICENSE)

---

## Acknowledgments

- Inspired by modern property management workflows
- Built with the power of React, Vite, and Tailwind CSS

---

## Contact

For questions, open an [issue](https://github.com/your-username/fixit-frontend/issues) or contact the maintainer.
