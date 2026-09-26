import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Ban,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getMyCertificates } from "../../services/api";
import type { Certificate } from "../../types/certificate";

export default function StudentCertificates() {
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCertificates() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyCertificates();
      setCertificates(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load your certificates.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCertificates();
  }, []);

  function handleDownload(documentUrl: string) {
    const url = documentUrl.startsWith("http")
      ? documentUrl
      : `http://localhost:8080${documentUrl}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f8fbff] text-[#384959]">
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="h-20 shrink-0 bg-white border-b border-[#BDDDFC] px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/student/dashboard")}
              className="w-10 h-10 rounded-xl border border-[#BDDDFC] flex items-center justify-center hover:bg-[#f3f8fd]"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="text-2xl font-bold">
                My Certificates
              </h1>

              <p className="text-sm text-[#6A89A7]">
                View certificates issued to you
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadCertificates}
            disabled={loading}
            className="h-10 px-4 rounded-xl bg-[#6A89A7] hover:bg-[#5d7c99] disabled:opacity-60 flex items-center gap-2 font-semibold"
            style={{ color: "#ffffff" }}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </header>

        {/* Main */}
        <main className="flex-1 min-h-0 px-8 py-6">
          <div className="h-full bg-white border border-[#BDDDFC] rounded-2xl shadow-sm flex flex-col overflow-hidden">
            {/* Error */}
            {error && (
              <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Summary */}
            <div className="px-6 py-5 border-b border-[#BDDDFC] flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6A89A7]">
                  Total Certificates
                </p>

                <p className="text-2xl font-bold mt-1">
                  {certificates.length}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-[#6A89A7]">
                <ShieldCheck size={20} />
                Blockchain Verified
              </div>
            </div>

            {/* Certificate list */}
            <div className="flex-1 min-h-0 overflow-auto p-6">
              {loading ? (
                <div className="h-full flex items-center justify-center text-[#6A89A7]">
                  Loading your certificates...
                </div>
              ) : certificates.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <ShieldCheck
                    size={46}
                    className="text-[#88BDF2] mb-4"
                  />

                  <h2 className="text-lg font-semibold">
                    No certificates yet
                  </h2>

                  <p className="text-sm text-[#6A89A7] mt-1">
                    Certificates issued to your account will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-5">
                  {certificates.map((certificate) => (
                    <div
                      key={certificate.certificateId}
                      className="border border-[#BDDDFC] rounded-2xl p-5 hover:shadow-sm transition"
                    >
                      {/* Top */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs text-[#6A89A7]">
                            Certificate ID
                          </p>

                          <p className="font-bold mt-1">
                            {certificate.certificateId}
                          </p>
                        </div>

                        {certificate.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                            <ShieldCheck size={14} />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
                            <Ban size={14} />
                            REVOKED
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4 mt-5">
                        <div>
                          <p className="text-xs text-[#6A89A7]">
                            Course
                          </p>

                          <p className="text-sm font-semibold mt-1">
                            {certificate.courseName}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-[#6A89A7]">
                            Issue Date
                          </p>

                          <p className="text-sm font-semibold mt-1">
                            {certificate.issueDate}
                          </p>
                        </div>
                      </div>

                      {/* Blockchain */}
                      <div className="mt-5 rounded-xl bg-[#f8fbff] border border-[#BDDDFC] p-4">
                        <p className="text-xs text-[#6A89A7]">
                          Blockchain Network
                        </p>

                        <p className="text-sm font-medium mt-1">
                          {certificate.blockchainNetwork}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 mt-5">
                        <button
                          type="button"
                          onClick={() =>
                            handleDownload(
                              certificate.documentUrl,
                            )
                          }
                          disabled={
                            certificate.status === "REVOKED"
                          }
                          className="flex-1 h-10 rounded-xl bg-[#384959] hover:bg-[#2f3e4c] disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                          style={{ color: "#ffffff" }}
                        >
                          <Download size={16} />
                          View Certificate
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate("/verify")
                          }
                          className="h-10 px-4 rounded-xl border border-[#6A89A7] text-[#384959] hover:bg-[#f3f8fd] flex items-center justify-center gap-2 font-semibold"
                        >
                          <ExternalLink size={16} />
                          Verify
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}