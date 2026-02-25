import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";

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
import Profile from "./pages/Profile.jsx";
import Contact from "./pages/Contact.jsx";

import MockTestShell from "./pages/MockTestShell.jsx";
import MockTestHistory from "./pages/MockTestHistory.jsx";
import StartMockTest from "./pages/StartMockTest.jsx";

import ResumeRank from "./pages/ResumeRank.jsx";
import AtsHistory from "./pages/AtsHistory.jsx";

import VerifyEmail from "./pages/VerifyEmail.jsx";
import CheckEmail from "./pages/CheckEmail.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import VerifyRequired from "./pages/VerifyRequired.jsx";

import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import AdminRoute from "./auth/AdminRoute.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import AdminOverview from "./admin/pages/AdminOverview.jsx";
import AdminUsers from "./admin/pages/AdminUsers.jsx";
import AdminCoursesStudying from "./admin/pages/AdminCoursesStudying.jsx";
import AdminCourseProgress from "./admin/pages/AdminCourseProgress.jsx";
import AdminQuizPerformance from "./admin/pages/AdminQuizPerformance.jsx";
import AdminMockTestAnalytics from "./admin/pages/AdminMockTestAnalytics.jsx";
import AdminUserDetail from "./admin/pages/AdminUserDetail.jsx";
import AdminCourseDetail from "./admin/pages/AdminCourseDetail.jsx";
import AdminMockTestDetail from "./admin/pages/AdminMockTestDetail.jsx";
import AdminUserCourseQuizResults from "./admin/pages/AdminUserCourseQuizResults.jsx";
import { useAuth } from "./auth/AuthProvider.jsx";

function RoleRedirector() {
  const { user, loading } = useAuth();
  const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || "admin@zenithlearning.site").toLowerCase();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    const email = (user?.email || "").toLowerCase();
    const isAdmin = !!email && email === ADMIN_EMAIL;
    const path = location.pathname || "/";

    // If admin, always land on /admin (unless already there)
    if (isAdmin && !path.startsWith("/admin")) {
      navigate("/admin", { replace: true });
      return;
    }

    // If not admin, block /admin routes
    if (!isAdmin && path.startsWith("/admin")) {
      navigate("/", { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  return null;
}

export default function App() {
  return (
    <Router>
      <RoleRedirector />

      <ErrorBoundary>
        <Routes>
          

          {/* ✅ Mock Test (no main header/footer) */}
          <Route
            path="/mock-test/:sessionId"
            element={
              <ProtectedRoute>
                <MockTestShell />
              </ProtectedRoute>
            }
          />

          {/* Main App Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="services" element={<Services />} />
            <Route path="contact" element={<Contact />} />
            {/* Public */}   
          
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-required" element={<VerifyRequired />} />
            {/* Protected pages */}
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
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
              path="my-courses"
              element={
                <ProtectedRoute>
                  <MyCourses />
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

            <Route
              path="course/:title/videos"
              element={
                <ProtectedRoute>
                  <VideoPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="course/:title"
              element={
                <ProtectedRoute>
                  <VideoPage />
                </ProtectedRoute>
              }
            />

            <Route path="video-detail" element={<VideoDetailPage />} />

            
            {/* ✅ Mock Test cards are on Home. Dedicated form page (like CourseForm). */}
            <Route
              path="start-mock-test"
              element={
                <ProtectedRoute>
                  <StartMockTest />
                </ProtectedRoute>
              }
            />

            {/* Backward compatible: /mock-test opens the form */}
            <Route
              path="mock-test"
              element={
                <ProtectedRoute>
                  <StartMockTest />
                </ProtectedRoute>
              }
            />

            <Route
              path="mock-test-history"
              element={
                <ProtectedRoute>
                  <MockTestHistory />
                </ProtectedRoute>
              }
            />

            {/* Alias route */}
            <Route
              path="my-tests"
              element={
                <ProtectedRoute>
                  <MockTestHistory />
                </ProtectedRoute>
              }
            />

            {/* ✅ Resume Rank + ATS History */}
            <Route
              path="resume-rank"
              element={
                <ProtectedRoute>
                  <ResumeRank />
                </ProtectedRoute>
              }
            />
            <Route
              path="ats-history"
              element={
                <ProtectedRoute>
                  <AtsHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="resume-rank/history"
              element={
                <ProtectedRoute>
                  <AtsHistory />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="user/:uid" element={<AdminUserDetail />} />
            <Route path="user/:uid/course/:courseTitle/quizzes" element={<AdminUserCourseQuizResults />} />
            <Route path="user/:uid/mocktests/:sessionId" element={<AdminMockTestDetail />} />
            <Route path="course/:courseTitle" element={<AdminCourseDetail />} />
            <Route path="courses-studying" element={<AdminCoursesStudying />} />
            <Route path="courses" element={<AdminCoursesStudying />} />
            <Route path="course-progress" element={<AdminCourseProgress />} />
            <Route path="progress" element={<AdminCourseProgress />} />
            <Route path="quiz-performance" element={<AdminQuizPerformance />} />
            <Route path="quizzes" element={<AdminQuizPerformance />} />
            <Route path="mocktest-analytics" element={<AdminMockTestAnalytics />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}
