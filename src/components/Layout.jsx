import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar/Navbar.jsx";
import Footer from "./Footer/Footer.jsx";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <div className="flex-1 pt-6 pb-10">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
