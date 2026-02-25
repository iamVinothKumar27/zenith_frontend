import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar/Navbar.jsx";
import Footer from "./Footer/Footer.jsx";

export default function Layout() {
  const location = useLocation();

  // ✅ Video learning pages should feel like a dedicated learning mode
  // (no universal Navbar/Footer)
  const path = location.pathname || "";

  // ✅ Hide universal Navbar/Footer only for learning pages (videos, player etc.)
  // ❗ CourseForm should KEEP Navbar/Footer
  const hideChrome = path.startsWith("/course/") && !path.endsWith("/form");

  if (hideChrome) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
