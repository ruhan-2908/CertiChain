import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="app-screen flex flex-col">
      <Navbar />

      <main className="flex min-h-0 flex-1 items-center">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-8 lg:grid-cols-2">

          {/* LEFT */}
          <section>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#BDDDFC] bg-white px-4 py-2 text-sm font-medium text-[#6A89A7] shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Blockchain-Powered Verification
            </div>

            <h1 className="mt-7 text-5xl font-bold leading-[1.1] tracking-tight text-[#384959] xl:text-6xl">
              Verify Certificates
              <span className="block text-[#6A89A7]">
                with Confidence.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              CertiChain provides a secure and transparent way to verify
              academic certificates using blockchain technology and
              cryptographic verification.
            </p>

            <div className="mt-8 flex gap-4">
              <Link
                to="/verify"
                className="inline-flex items-center gap-2 rounded-xl bg-[#384959] px-6 py-3.5 font-semibold shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-[#2f3e4c]"
                style={{ color: "#ffffff" }}
              >
                Verify a Certificate
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                to="/verify"
                className="inline-flex items-center gap-2 rounded-xl border border-[#BDDDFC] bg-white px-6 py-3.5 font-semibold transition hover:bg-[#BDDDFC]/30"
                style={{ color: "#384959" }}
              >
                How It Works
              </Link>
            </div>

            {/* Mini features */}
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              <MiniFeature
                icon={<ShieldCheck />}
                title="Blockchain"
              />

              <MiniFeature
                icon={<FileCheck2 />}
                title="Verified"
              />

              <MiniFeature
                icon={<LockKeyhole />}
                title="Tamper Proof"
              />
            </div>
          </section>

          {/* RIGHT CERTIFICATE CARD */}
          <section className="relative flex justify-center">
            <div className="absolute h-80 w-80 rounded-full bg-[#BDDDFC]/40 blur-3xl" />

            <div className="relative w-full max-w-xl rounded-3xl border border-[#BDDDFC] bg-white p-8 shadow-2xl">

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Certificate Status
                  </p>

                  <h2 className="mt-1 text-3xl font-bold text-[#384959]">
                    Authentic
                  </h2>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="mt-8 rounded-xl bg-[#f8fbff] p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6A89A7]">
                  Certificate ID
                </p>

                <p className="mt-2 font-mono text-base font-semibold text-[#384959]">
                  CERT-2026-00124
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#f8fbff] p-5">
                  <p className="text-xs text-slate-400">
                    Issued By
                  </p>

                  <p className="mt-2 font-semibold text-[#384959]">
                    PSG College
                  </p>
                </div>

                <div className="rounded-xl bg-[#f8fbff] p-5">
                  <p className="text-xs text-slate-400">
                    Status
                  </p>

                  <p className="mt-2 font-semibold text-green-600">
                    Verified
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5 text-sm text-[#6A89A7]">
                <LockKeyhole className="h-4 w-4" />
                Hash verified against blockchain
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function MiniFeature({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
      <div className="text-[#6A89A7]">
        {icon}
      </div>

      <span className="text-xs font-semibold text-[#384959]">
        {title}
      </span>
    </div>
  );
}