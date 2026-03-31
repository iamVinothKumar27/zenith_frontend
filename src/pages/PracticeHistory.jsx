import React from "react";
import { Navigate } from "react-router-dom";

// Backward-compatible route: keep existing path but show unified Full History page.
export default function PracticeHistory() {
  return <Navigate to="/mock-test-history?tab=practice" replace />;
}
