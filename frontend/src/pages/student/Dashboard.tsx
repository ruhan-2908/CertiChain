import type React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  FileText,
  LogOut,
  Search,
  ShieldCheck,
} from "lucide-react";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("certichain_token");
    localStorage.removeItem("certichain_role");
    localStorage.removeItem("certichain_user");

    navigate("/login");
  };

  return (
    <div className="app-screen flex bg-[#f8fbff]">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-[#384959] text-white md:flex">
        <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>

          <div>
            <p className="font-bold">CertiChain</p>
            <p className="text-xs text-[#BDDDFC]">
              Student Portal
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <StudentSidebarItem
            icon={<Award />}
            label="Dashboard"
            to="/student/dashboard"
            active
          />

          <StudentSidebarItem
            icon={<FileText />}
            label="My Certificates"
            to="/student/certificates"
          />

          <StudentSidebarItem
            icon={<Search />}
            label="Verify Certificate"
            to="/verify"
          />
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
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
        <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
          <div>
            <p className="text-sm text-slate-500">
              Student Portal
            </p>

            <h1 className="text-xl font-bold text-[#384959]">
              Dashboard
            </h1>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#BDDDFC] font-bold text-[#384959]">
            S
          </div>
        </header>

        <div className="h-[calc(100vh-72px)] overflow-hidden p-6 lg:p-8">
          {/* Welcome */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#384959]">
                Welcome, Student
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Access and verify your certificates.
              </p>
            </div>

            <Link
              to="/verify"
              className="hidden items-center gap-2 rounded-xl bg-[#384959] px-5 py-3 text-sm font-semibold sm:inline-flex"
              style={{ color: "#ffffff" }}
            >
              <Search className="h-4 w-4" />
              Verify Certificate
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              icon={<Award />}
              label="My Certificates"
              value="—"
            />

            <StatCard
              icon={<ShieldCheck />}
              label="Active Certificates"
              value="—"
            />
          </div>

          {/* Actions */}
          <div className="mt-7 grid h-[calc(100%-190px)] min-h-0 gap-6 lg:grid-cols-2">
            <ActionCard
              icon={<FileText />}
              title="My Certificates"
              description="View certificates issued to your student account and access the generated PDF."
              to="/student/certificates"
            />

            <ActionCard
              icon={<Search />}
              title="Verify Certificate"
              description="Verify a certificate using its Certificate ID or upload a certificate PDF."
              to="/verify"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StudentSidebarItem({
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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#BDDDFC]/40 text-[#6A89A7]">
        {icon}
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

function ActionCard({
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
      className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-[#88BDF2] hover:shadow-md"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#BDDDFC]/40 text-[#6A89A7]">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-bold text-[#384959]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </Link>
  );
}