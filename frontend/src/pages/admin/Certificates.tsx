import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, ShieldCheck, Ban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getCertificates,
  revokeCertificate,
} from "../../services/api";
import type { Certificate } from "../../types/certificate";

export default function Certificates() {
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadCertificates() {
    try {
      setLoading(true);
      setError("");

      const data = await getCertificates();
      setCertificates(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load certificates.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCertificates();
  }, []);

  async function handleRevoke(certificateId: string) {
    const confirmed = window.confirm(
      `Are you sure you want to revoke ${certificateId}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setRevokingId(certificateId);
      setError("");

      await revokeCertificate(certificateId);

      setCertificates((current) =>
        current.map((certificate) =>
          certificate.certificateId === certificateId
            ? {
                ...certificate,
                status: "REVOKED",
              }
            : certificate,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to revoke certificate.",
      );
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f8fbff] text-[#384959]">
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="h-20 shrink-0 bg-white border-b border-[#BDDDFC] px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin/dashboard")}
              className="w-10 h-10 rounded-xl border border-[#BDDDFC] flex items-center justify-center hover:bg-[#f3f8fd]"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="text-2xl font-bold">
                Certificates
              </h1>
              <p className="text-sm text-[#6A89A7]">
                Manage issued certificates
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

            {/* Table Header */}
            <div className="px-6 py-5 border-b border-[#BDDDFC] grid grid-cols-[1.2fr_1.3fr_1fr_1fr_120px] gap-4 text-xs font-bold uppercase tracking-wide text-[#6A89A7]">
              <span>Certificate ID</span>
              <span>Student</span>
              <span>Course</span>
              <span>Issue Date</span>
              <span>Status</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-auto">
              {loading ? (
                <div className="h-full flex items-center justify-center text-[#6A89A7]">
                  Loading certificates...
                </div>
              ) : certificates.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <ShieldCheck
                    size={42}
                    className="text-[#88BDF2] mb-3"
                  />

                  <h2 className="font-semibold text-lg">
                    No certificates found
                  </h2>

                  <p className="text-sm text-[#6A89A7] mt-1">
                    Certificates issued by the administrator will appear here.
                  </p>
                </div>
              ) : (
                certificates.map((certificate) => (
                  <div
                    key={certificate.certificateId}
                    className="px-6 py-5 border-b border-[#edf4fb] grid grid-cols-[1.2fr_1.3fr_1fr_1fr_120px] gap-4 items-center"
                  >
                    <div>
                      <p className="font-semibold text-sm">
                        {certificate.certificateId}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-sm">
                        {certificate.studentName}
                      </p>
                      <p className="text-xs text-[#6A89A7]">
                        Student ID: {certificate.studentId}
                      </p>
                    </div>

                    <p className="text-sm truncate">
                      {certificate.courseName}
                    </p>

                    <p className="text-sm">
                      {certificate.issueDate}
                    </p>

                    <div>
                      {certificate.status === "ACTIVE" ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleRevoke(certificate.certificateId)
                          }
                          disabled={revokingId === certificate.certificateId}
                          className="h-9 px-3 rounded-lg bg-[#fff4e8] text-[#b76500] hover:bg-[#ffe9d1] disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <Ban size={14} />
                          {revokingId === certificate.certificateId
                            ? "Revoking..."
                            : "Revoke"}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
                          <Ban size={14} />
                          REVOKED
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}