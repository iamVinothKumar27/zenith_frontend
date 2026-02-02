import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import Home from "./components/Home";
import Login from "./components/login";
import Signup from "./components/Signup";
import CourseForm from "./components/courses/CourseForm.jsx";
import VideoPage from "./components/courses/VideoPage";
import VideoDetailPage from "./components/courses/VideoDetailPage";
import MyCourses from "./components/courses/MyCourses.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Services from "./pages/Services";
import Notes from "./pages/Notes.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import AdminRoute from "./auth/AdminRoute.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import AdminOverview from "./admin/pages/AdminOverview.jsx";
import AdminUsers from "./admin/pages/AdminUsers.jsx";
import AdminCoursesStudying from "./admin/pages/AdminCoursesStudying.jsx";
import AdminCourseProgress from "./admin/pages/AdminCourseProgress.jsx";
import AdminQuizPerformance from "./admin/pages/AdminQuizPerformance.jsx";
import { useAuth } from "./auth/AuthProvider.jsx";

function RoleRedirector() {
  const { profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    const role = profile?.role;
    const path = location.pathname || "/";

    // ✅ If you are admin, always land on /admin (unless you're already there)
    if (role === "admin" && !path.startsWith("/admin")) {
      navigate("/admin", { replace: true });
      return;
    }

    // If not admin, block /admin
    if (role !== "admin" && path.startsWith("/admin")) {
      navigate("/", { replace: true });
    }
  }, [profile, loading, location.pathname, navigate]);

  return null;
}


const App = () => {
  return (
    <Router>
      <RoleRedirector />
      <Routes>
        {/* Video learning page should NOT show global header/footer */}
        <Route
          path="/course/:title/videos"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <VideoPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <VideoPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route path="/services" element={<Services />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="courses" element={<AdminCoursesStudying />} />
          <Route path="progress" element={<AdminCourseProgress />} />
          <Route path="quizzes" element={<AdminQuizPerformance />} />
        </Route>


        {/* All other pages use global Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route
            path="my-courses"
            element={
              <ProtectedRoute>
                <MyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="notes"
            element={
              <ProtectedRoute>
                <Notes />
              </ProtectedRoute>
            }
          />
          <Route
            path="notes"
            element={
              <ProtectedRoute>
                <Notes />
              </ProtectedRoute>
            }
          />
          <Route
            path="course/:title/form"
            element={
              <ProtectedRoute>
                <CourseForm />
              </ProtectedRoute>
            }
          />
          <Route path="video-detail" element={<VideoDetailPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
