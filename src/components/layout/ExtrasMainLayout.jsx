import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

// You can add a main wrapper here for consistent background/etc if you want.
const ExtrasMainLayout = () => (
  <div className="flex flex-col min-h-screen bg-white">
    <Header />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default ExtrasMainLayout;