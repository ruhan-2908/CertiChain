import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import VerifyCertificate from "./pages/public/VerifyCertificate";

import AdminDashboard from "./pages/admin/AdminDashboard";
import IssueCertificate from "./pages/admin/IssueCertificate";
import Certificates from "./pages/admin/Certificates";

import StudentDashboard from "./pages/student/Dashboard";
import StudentCertificates from "./pages/student/Certificates";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route
          path="/"
          element={<VerifyCertificate />}
        />

        <Route
          path="/verify"
          element={<VerifyCertificate />}
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* ================= ADMIN ================= */}

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/issue"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <IssueCertificate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/certificates"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <Certificates />
            </ProtectedRoute>
          }
        />

        {/* Logs endpoint does not currently exist
            in the backend API contract. */}
        <Route
          path="/admin/logs"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminLogsPlaceholder />
            </ProtectedRoute>
          }
        />

        {/* ================= STUDENT ================= */}

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="STUDENT">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/certificates"
          element={
            <ProtectedRoute allowedRole="STUDENT">
              <StudentCertificates />
            </ProtectedRoute>
          }
        />

        {/* Unknown route */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}


/*
 * Temporary logs page.
 *
 * The backend API contract currently does not expose
 * GET /api/verification-logs or any other logs endpoint.
 *
 * We therefore do not invent an API for it.
 */
function AdminLogsPlaceholder() {
  return (
    <div className="h-screen bg-[#f8fbff] flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-[#BDDDFC] bg-white p-8 text-center shadow-sm">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#BDDDFC]/50 text-[#384959]">
          <span className="text-2xl">i</span>
        </div>

        <h1 className="mt-5 text-xl font-bold text-[#384959]">
          Verification Logs
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#6A89A7]">
          The verification logs database table exists,
          but the current backend API contract does not
          provide an HTTP endpoint for retrieving logs.
        </p>

        <button
          type="button"
          onClick={() => window.history.back()}
          className="mt-6 rounded-xl bg-[#384959] px-5 py-3 text-sm font-semibold"
          style={{ color: "#ffffff" }}
        >
          Go Back
        </button>

      </div>
    </div>
  );
}

export default App;