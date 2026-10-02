import { useState } from "react";
import type { FormEvent } from "react";
import {
  ShieldCheck,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  FileCheck2,
} from "lucide-react";

import { verifyCertificate } from "../../services/api";
import type {
  VerificationResponse,
  VerificationResult,
} from "../../types/certificate";

export default function VerifyCertificate() {
  const [certificateId, setCertificateId] =
    useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [result, setResult] =
    useState<VerificationResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setResult(null);

    if (!file) {
      setError(
        "Please upload the certificate PDF.",
      );
      return;
    }

    if (file.type !== "application/pdf") {
      setError(
        "Only PDF certificate files are supported.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await verifyCertificate(
        file,
        certificateId,
      );

      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Certificate verification failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  function getResultConfig(
    verificationResult: VerificationResult,
  ) {
    switch (verificationResult) {
      case "AUTHENTIC":
        return {
          title: "Certificate Authentic",
          description:
            "The uploaded certificate matches the registered certificate.",
          icon: CheckCircle2,
          className:
            "border-green-200 bg-green-50 text-green-700",
        };

      case "TAMPERED":
        return {
          title: "Certificate Tampered",
          description:
            "The uploaded certificate does not match the registered certificate.",
          icon: XCircle,
          className:
            "border-red-200 bg-red-50 text-red-700",
        };

      case "REVOKED":
        return {
          title: "Certificate Revoked",
          description:
            "This certificate was previously registered but has been revoked.",
          icon: AlertTriangle,
          className:
            "border-orange-200 bg-orange-50 text-orange-700",
        };

      case "NOT_FOUND":
      default:
        return {
          title: "Certificate Not Found",
          description:
            "No registered certificate could be matched with the supplied document.",
          icon: HelpCircle,
          className:
            "border-slate-200 bg-slate-50 text-slate-700",
        };
    }
  }

  const resultConfig = result
    ? getResultConfig(result.result)
    : null;

  return (
    <div className="h-screen overflow-hidden bg-[#f8fbff] text-[#384959]">
      <div className="flex h-full flex-col">
        {/* Navbar */}
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-[#BDDDFC] bg-white px-6 lg:px-10">
          <button
            type="button"
            onClick={() =>
              (window.location.href = "/")
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#384959]">
              <ShieldCheck
                size={22}
                style={{
                  color: "#ffffff",
                }}
              />
            </div>

            <div className="text-left">
              <h1 className="text-lg font-bold">
                CertiChain
              </h1>
              <p className="text-xs text-[#6A89A7]">
                Certificate Verification
              </p>
            </div>
          </button>

          <a
            href="/login"
            className="rounded-xl border border-[#BDDDFC] bg-white px-4 py-2.5 text-sm font-semibold text-[#384959] transition hover:bg-[#f8fbff]"
          >
            Admin / Student Login
          </a>
        </header>

        {/* Main */}
        <main className="min-h-0 flex-1 overflow-auto px-6 py-6 lg:px-10 lg:py-8">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
            {/* Verification form */}
            <section className="rounded-2xl border border-[#BDDDFC] bg-white p-6 shadow-sm lg:p-8">
              <div className="mb-7">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#BDDDFC]/60 text-[#384959]">
                  <FileCheck2 size={24} />
                </div>

                <h2 className="text-2xl font-bold">
                  Verify a Certificate
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#6A89A7]">
                  Upload the original certificate PDF.
                  You may also provide the Certificate ID
                  if available.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Certificate ID */}
                <div>
                  <label
                    htmlFor="certificate-id"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Certificate ID
                    <span className="ml-1 font-normal text-[#6A89A7]">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="certificate-id"
                    type="text"
                    value={certificateId}
                    onChange={(event) =>
                      setCertificateId(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. CERT-2026-001"
                    className="w-full rounded-xl border border-[#BDDDFC] px-4 py-3 text-sm outline-none transition focus:border-[#6A89A7] focus:ring-2 focus:ring-[#88BDF2]/30"
                  />
                </div>

                {/* PDF */}
                <div>
                  <label
                    htmlFor="verify-file"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Certificate PDF
                  </label>

                  <label
                    htmlFor="verify-file"
                    className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-[#6A89A7] bg-[#f8fbff] p-5 transition hover:bg-[#BDDDFC]/30"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#BDDDFC]/60">
                      <Upload size={20} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {file
                          ? file.name
                          : "Select certificate PDF"}
                      </p>

                      <p className="mt-1 text-xs text-[#6A89A7]">
                        PDF files only
                      </p>
                    </div>
                  </label>

                  <input
                    id="verify-file"
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(event) => {
                      setFile(
                        event.target.files?.[0] ??
                          null,
                      );
                    }}
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#384959] px-5 py-3.5 text-sm font-semibold transition hover:bg-[#6A89A7] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    color: "#ffffff",
                  }}
                >
                  <Search size={18} />

                  {loading
                    ? "Verifying..."
                    : "Verify Certificate"}
                </button>
              </form>

              <div className="mt-6 rounded-xl bg-[#BDDDFC]/30 p-4">
                <p className="text-xs leading-5 text-[#6A89A7]">
                  Verification compares the uploaded
                  certificate against the certificate
                  registered by CertiChain.
                </p>
              </div>
            </section>

            {/* Result */}
            <section className="rounded-2xl border border-[#BDDDFC] bg-white p-6 shadow-sm lg:p-8">
              {!result ? (
                <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#BDDDFC]/50 text-[#6A89A7]">
                    <ShieldCheck size={30} />
                  </div>

                  <h3 className="mt-5 text-xl font-bold">
                    Verification Result
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#6A89A7]">
                    Your certificate verification result
                    will appear here after you upload a
                    PDF.
                  </p>
                </div>
              ) : (
                <div>
                  {resultConfig &&
                    (() => {
                      const Icon =
                        resultConfig.icon;

                      return (
                        <div
                          className={`rounded-2xl border p-5 ${resultConfig.className}`}
                        >
                          <div className="flex items-start gap-4">
                            <Icon
                              size={28}
                              className="mt-0.5 shrink-0"
                            />

                            <div>
                              <h3 className="text-xl font-bold">
                                {resultConfig.title}
                              </h3>

                              <p className="mt-1 text-sm leading-6">
                                {
                                  resultConfig.description
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  <div className="mt-6 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6A89A7]">
                        Certificate ID
                      </p>

                      <p className="mt-1 break-all text-sm font-semibold">
                        {result.certificateId ||
                          "Not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6A89A7]">
                        Student
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {result.studentName ||
                          "Not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6A89A7]">
                        Course
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {result.courseName ||
                          "Not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6A89A7]">
                        Issue Date
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {result.issueDate ||
                          "Not available"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}