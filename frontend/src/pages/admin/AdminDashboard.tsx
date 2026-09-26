import type React from "react";
import { useEffect, useState } from "react";
import {
  Activity,
  Award,
  CheckCircle2,
  FilePlus2,
  FileText,
  LogOut,
  Menu,
  ShieldCheck,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { getCertificates } from "../../services/api";
import type { Certificate } from "../../types/certificate";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(true);
  const [certificateError, setCertificateError] = useState("");

  useEffect(() => {
    loadCertificates();
  }, []);

  async function loadCertificates() {
    try {
      setLoadingCertificates(true);
      setCertificateError("");

      const data = await getCertificates();
      setCertificates(data);
    } catch (err) {
      setCertificateError(
        err instanceof Error
          ? err.message
          : "Failed to load certificates.",
      );
    } finally {
      setLoadingCertificates(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("certichain_token");
    localStorage.removeItem("certichain_role");
    localStorage.removeItem("certichain_user");

    navigate("/login");
  };

  const totalCertificates = certificates.length;

  const activeCertificates = certificates.filter(
    (certificate) => certificate.status === "ACTIVE",
  ).length;

  const revokedCertificates = certificates.filter(
    (certificate) => certificate.status === "REVOKED",
  ).length;

  return (
    <div className="app-screen flex bg-[#f8fbff]">

      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-[#384959] text-white md:flex">

        {/* Logo */}
        <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>

          <div>
            <p className="font-bold">
              CertiChain
            </p>

            <p className="text-xs text-[#BDDDFC]">
              Admin Portal
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">

          <SidebarItem
            icon={<Activity />}
            label="Dashboard"
            active
            to="/admin/dashboard"
          />

          <SidebarItem
            icon={<FilePlus2 />}
            label="Issue Certificate"
            to="/admin/issue"
          />

          <SidebarItem
            icon={<FileText />}
            label="Certificates"
            to="/admin/certificates"
          />

          <SidebarItem
            icon={<Activity />}
            label="Verification Logs"
            to="/admin/logs"
          />

        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1">

        {/* Top bar */}
        <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <p className="text-sm text-slate-500">
                Administration
              </p>

              <h1 className="text-xl font-bold text-[#384959]">
                Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#384959]">
                Administrator
              </p>

              <p className="text-xs text-slate-400">
                admin@certichain.com
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#BDDDFC] font-bold text-[#384959]">
              A
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="h-[calc(100vh-72px)] overflow-hidden p-6 lg:p-8">

          {/* Welcome */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#384959]">
                Good morning, Administrator
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Here's an overview of your certificate registry.
              </p>
            </div>

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={loadCertificates}
                disabled={loadingCertificates}
                className="hidden items-center gap-2 rounded-xl border border-[#BDDDFC] bg-white px-4 py-3 text-sm font-semibold text-[#384959] transition hover:bg-[#f8fbff] disabled:opacity-50 sm:inline-flex"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loadingCertificates ? "animate-spin" : ""
                  }`}
                />

                Refresh
              </button>

              <Link
                to="/admin/issue"
                className="hidden items-center gap-2 rounded-xl bg-[#384959] px-5 py-3 text-sm font-semibold transition hover:bg-[#2f3e4c] sm:inline-flex"
                style={{ color: "#ffffff" }}
              >
                <FilePlus2 className="h-4 w-4" />
                Issue Certificate
              </Link>

            </div>
          </div>

          {/* Backend error */}
          {certificateError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-center justify-between gap-4">
                <span>
                  {certificateError}
                </span>

                <button
                  type="button"
                  onClick={loadCertificates}
                  className="font-semibold underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="mt-7 grid grid-cols-2 gap-4 xl:grid-cols-4">

            <StatCard
              icon={<Award />}
              label="Total Certificates"
              value={
                loadingCertificates
                  ? "..."
                  : String(totalCertificates)
              }
              change="Live"
            />

            <StatCard
              icon={<CheckCircle2 />}
              label="Active"
              value={
                loadingCertificates
                  ? "..."
                  : String(activeCertificates)
              }
              change="Current"
            />

            <StatCard
              icon={<XCircle />}
              label="Revoked"
              value={
                loadingCertificates
                  ? "..."
                  : String(revokedCertificates)
              }
              change="Current"
            />

            <StatCard
              icon={<Activity />}
              label="Verifications"
              value="—"
              change="No API"
            />

          </div>

          {/* Bottom area */}
          <div className="mt-7 grid h-[calc(100%-220px)] min-h-0 gap-6 lg:grid-cols-[1.4fr_0.6fr]">

            {/* Recent certificates */}
            <div className="min-h-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#384959]">
                    Recent Certificates
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Latest certificates registered in the system
                  </p>
                </div>

                <Link
                  to="/admin/certificates"
                  className="text-xs font-semibold"
                  style={{ color: "#6A89A7" }}
                >
                  View all
                </Link>
              </div>

              <div className="mt-5 space-y-3 overflow-hidden">

                {loadingCertificates ? (
                  <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                    Loading certificates...
                  </div>
                ) : certificates.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center text-center">
                    <FileText className="h-8 w-8 text-[#88BDF2]" />

                    <p className="mt-3 text-sm font-semibold text-[#384959]">
                      No certificates yet
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Issued certificates will appear here.
                    </p>
                  </div>
                ) : (
                  certificates.slice(0, 4).map((certificate) => (
                    <CertificateRow
                      key={certificate.certificateId}
                      id={certificate.certificateId}
                      student={certificate.studentName}
                      course={certificate.courseName}
                      status={
                        certificate.status === "ACTIVE"
                          ? "ACTIVE"
                          : "REVOKED"
                      }
                    />
                  ))
                )}

              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h3 className="font-bold text-[#384959]">
                Quick Actions
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Frequently used admin functions
              </p>

              <div className="mt-5 space-y-3">

                <QuickAction
                  icon={<FilePlus2 />}
                  title="Issue Certificate"
                  description="Create a new certificate"
                  to="/admin/issue"
                />

                <QuickAction
                  icon={<FileText />}
                  title="View Certificates"
                  description="Manage issued certificates"
                  to="/admin/certificates"
                />

                <QuickAction
                  icon={<Activity />}
                  title="Verification Logs"
                  description="Review verification activity"
                  to="/admin/logs"
                />

              </div>

              {/* Blockchain status */}
              <div className="mt-5 rounded-xl bg-[#BDDDFC]/25 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#6A89A7]" />

                  <p className="text-sm font-semibold text-[#384959]">
                    Blockchain Status
                  </p>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Network connected and ready for certificate
                  registration.
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />

                  <span className="text-xs font-medium text-green-600">
                    Connected
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}


/* Sidebar item */
function SidebarItem({
  icon,
  label,
  to,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-white text-[#384959]"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      {icon}

      {label}
    </Link>
  );
}


/* Stats */
function StatCard({
  icon,
  label,
  value,
  change,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#BDDDFC]/40 text-[#6A89A7]">
          {icon}
        </div>

        <span className="text-xs font-medium text-[#6A89A7]">
          {change}
        </span>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-[#384959]">
        {value}
      </p>
    </div>
  );
}


/* Certificate row */
function CertificateRow({
  id,
  student,
  course,
  status,
}: {
  id: string;
  student: string;
  course: string;
  status: "ACTIVE" | "REVOKED";
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#f8fbff] px-4 py-3">

      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#BDDDFC]">
          <FileText className="h-4 w-4 text-[#384959]" />
        </div>

        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-semibold text-[#384959]">
            {id}
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-500">
            {student} • {course}
          </p>
        </div>
      </div>

      <span
        className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
          status === "ACTIVE"
            ? "bg-green-100 text-green-700"
            : "bg-orange-100 text-orange-700"
        }`}
      >
        {status}
      </span>

    </div>
  );
}


/* Quick action */
function QuickAction({
  icon,
  title,
  description,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-[#88BDF2] hover:bg-[#f8fbff]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#BDDDFC]/40 text-[#6A89A7]">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold text-[#384959]">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {description}
        </p>
      </div>
    </Link>
  );
}