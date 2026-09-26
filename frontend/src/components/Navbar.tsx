import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function Navbar() {
  return (
    <header className="h-[72px] shrink-0 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#384959]">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-[#384959]">
              CertiChain
            </h1>

            <p className="text-xs text-[#6A89A7]">
              Certificate Verification
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-3">
          <Link
            to="/verify"
            className="rounded-lg px-4 py-2 text-sm font-medium transition hover:bg-[#BDDDFC]/40"
            style={{ color: "#384959" }}
          >
            Verify Certificate
          </Link>

          <Link
            to="/login"
            className="rounded-lg bg-[#384959] px-5 py-2.5 text-sm font-semibold transition hover:bg-[#2f3e4c]"
            style={{ color: "#ffffff" }}
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}