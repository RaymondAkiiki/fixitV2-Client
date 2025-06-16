import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="flex min-h-screen bg-[#f8fafb] text-gray-800 transition-colors duration-500">
      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 px-2 py-4 md:px-8 md:py-8 bg-[#f8fafb] animate-fade-in">
          {children}
        </main>
        {/* Footer: Optional, can be added here if you want */}
      </div>
    </div>
  );
};

export default MainLayout;




// import React from "react";
// import Sidebar from "../Sidebar";
// import Navbar from "../Navbar";
// import Footer from "../Footer";

// const MainLayout = ({ children }) => (
//   <div className="flex min-h-screen bg-gray-100">
//     <Sidebar />
//     <div className="flex-1 flex flex-col min-h-screen">
//       <Navbar />
//       <main className="flex-1 p-4">{children}</main>
//       <Footer />
//     </div>
//   </div>
// );

// export default MainLayout;