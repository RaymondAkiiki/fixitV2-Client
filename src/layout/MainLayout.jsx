import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

/**
 * ExtrasMainLayout provides a clean, full-height layout for public pages
 * (no sidebar). It includes a header, main content area, and footer.
 */
const ExtrasMainLayout = () => (
  <div className="flex flex-col min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 font-sans">
    <Header />
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default ExtrasMainLayout;