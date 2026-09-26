import { useState } from "react";
import type { ChangeEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Search,
  FileCheck2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  verifyCertificate,
  verifyCertificateFile,
} from "../../services/api";

import type {
  VerifyCertificateResponse,
  VerifyUploadResponse,
} from "../../types/certificate";

type VerificationData =
  | VerifyCertificateResponse
  | VerifyUploadResponse;

export default function VerifyCertificate() {
  const navigate = useNavigate();

  const [certificateId, setCertificateId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loadingId, setLoadingId] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);

  const [result, setResult] = useState<VerificationData | null>(null);
  const [error, setError] = useState("");

  async function handleIdVerification() {
    if (!certificateId.trim()) {
      setError("Please enter a certificate ID.");
      return;
    }

    try {
      setLoadingId(true);
      setError("");
      setResult(null);

      const response = await verifyCertificate(
        certificateId.trim(),
      );

      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Certificate verification failed.",
      );
    } finally {
      setLoadingId(false);
    }
  }

  async function handleFileVerification() {
    if (!certificateId.trim()) {
      setError("Please enter a certificate ID first.");
      return;
    }

    if (!selectedFile) {
      setError("Please select a certificate PDF.");
      return;
    }

    try {
      setLoadingFile(true);
      setError("");
      setResult(null);

      const response = await verifyCertificateFile(
        certificateId.trim(),
        selectedFile,
      );

      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Certificate file verification failed.",
      );
    } finally {
      setLoadingFile(false);
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0] ?? null;

    setSelectedFile(file);
    setResult(null);
    setError("");

    if (file && file.type !== "application/pdf") {
      setSelectedFile(null);
      setError("Please select a PDF certificate.");
    }
  }

  function getResultTitle() {
    switch (result?.result) {
      case "AUTHENTIC":
        return "Certificate is Authentic";

      case "TAMPERED":
        return "Certificate has been Tampered";

      case "REVOKED":
        return "Certificate has been Revoked";

      case "NOT_FOUND":
        return "Certificate Not Found";

      default:
        return "";
    }
  }

  function getResultDescription() {
    switch (result?.result) {
      case "AUTHENTIC":
        return "The certificate matches the registered blockchain record.";

      case "TAMPERED":
        return "The uploaded certificate does not match the registered document hash.";

      case "REVOKED":
        return "This certificate was previously issued but has been revoked.";

      case "NOT_FOUND":
        return "No certificate with this ID was found in the verification system.";

      default:
        return "";
    }
  }

  function getResultStyles() {
    switch (result?.result) {
      case "AUTHENTIC":
        return {
          box: "border-green-200 bg-green-50",
          icon: "bg-green-100 text-green-700",
          text: "text-green-800",
        };

      case "TAMPERED":
        return {
          box: "border-red-200 bg-red-50",
          icon: "bg-red-100 text-red-700",
          text: "text-red-800",
        };

      case "REVOKED":
        return {
          box: "border-orange-200 bg-orange-50",
          icon: "bg-orange-100 text-orange-700",
          text: "text-orange-800",
        };

      default:
        return {
          box: "border-[#BDDDFC] bg-[#f8fbff]",
          icon: "bg-[#BDDDFC] text-[#384959]",
          text: "text-[#384959]",
        };
    }
  }

  const resultStyles = getResultStyles();

  return (
    <div className="h-screen overflow-hidden bg-[#f8fbff] text-[#384959]">
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="h-20 shrink-0 bg-white border-b border-[#BDDDFC] px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-10 h-10 rounded-xl border border-[#BDDDFC] flex items-center justify-center hover:bg-[#f3f8fd]"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="text-2xl font-bold">
                Verify Certificate
              </h1>

              <p className="text-sm text-[#6A89A7]">
                Verify certificate authenticity using CertiChain
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-[#6A89A7]">
            <ShieldCheck size={19} />
            Public Verification
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 flex items-center justify-center px-6 py-6">
          <div className="w-full max-w-5xl grid grid-cols-2 gap-6">
            {/* ID Verification */}
            <section className="bg-white border border-[#BDDDFC] rounded-2xl shadow-sm p-7">
              <div className="w-12 h-12 rounded-xl bg-[#BDDDFC]/60 flex items-center justify-center text-[#384959] mb-5">
                <Search size={23} />
              </div>

              <h2 className="text-xl font-bold">
                Verify by Certificate ID
              </h2>

              <p className="text-sm text-[#6A89A7] mt-2 mb-6">
                Enter the certificate ID to check its registration
                and current blockchain status.
              </p>

              <label
                htmlFor="certificateId"
                className="block text-sm font-semibold mb-2"
              >
                Certificate ID
              </label>

              <input
                id="certificateId"
                type="text"
                value={certificateId}
                onChange={(event) =>
                  setCertificateId(event.target.value)
                }
                placeholder="CERT-2026-000123"
                className="w-full h-12 rounded-xl border border-[#BDDDFC] px-4 outline-none focus:border-[#6A89A7] focus:ring-2 focus:ring-[#88BDF2]/30"
              />

              <button
                type="button"
                onClick={handleIdVerification}
                disabled={loadingId || loadingFile}
                className="w-full h-12 mt-4 rounded-xl bg-[#384959] hover:bg-[#2f3e4c] disabled:opacity-60 font-semibold flex items-center justify-center gap-2"
                style={{ color: "#ffffff" }}
              >
                <Search size={18} />

                {loadingId
                  ? "Checking..."
                  : "Verify Certificate"}
              </button>

              <div className="mt-5 rounded-xl bg-[#f8fbff] border border-[#BDDDFC] p-4">
                <p className="text-xs font-semibold text-[#6A89A7]">
                  What is checked?
                </p>

                <p className="text-sm mt-1">
                  Certificate registration and blockchain status.
                </p>
              </div>
            </section>

            {/* PDF Verification */}
            <section className="bg-white border border-[#BDDDFC] rounded-2xl shadow-sm p-7">
              <div className="w-12 h-12 rounded-xl bg-[#BDDDFC]/60 flex items-center justify-center text-[#384959] mb-5">
                <Upload size={23} />
              </div>

              <h2 className="text-xl font-bold">
                Verify Certificate PDF
              </h2>

              <p className="text-sm text-[#6A89A7] mt-2 mb-6">
                Upload the certificate PDF to compare its hash with
                the registered document.
              </p>

              <label
                htmlFor="certificateFile"
                className="block text-sm font-semibold mb-2"
              >
                Certificate PDF
              </label>

              <label
                htmlFor="certificateFile"
                className="h-12 border border-dashed border-[#6A89A7] rounded-xl px-4 flex items-center gap-3 cursor-pointer hover:bg-[#f8fbff]"
              >
                <FileCheck2
                  size={19}
                  className="text-[#6A89A7]"
                />

                <span className="text-sm truncate">
                  {selectedFile
                    ? selectedFile.name
                    : "Choose a PDF file"}
                </span>

                <input
                  id="certificateFile"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleFileVerification}
                disabled={
                  loadingFile ||
                  loadingId ||
                  !selectedFile
                }
                className="w-full h-12 mt-4 rounded-xl bg-[#6A89A7] hover:bg-[#5d7c99] disabled:opacity-60 font-semibold flex items-center justify-center gap-2"
                style={{ color: "#ffffff" }}
              >
                <Upload size={18} />

                {loadingFile
                  ? "Checking PDF..."
                  : "Verify PDF"}
              </button>

              <div className="mt-5 rounded-xl bg-[#f8fbff] border border-[#BDDDFC] p-4">
                <p className="text-xs font-semibold text-[#6A89A7]">
                  What is checked?
                </p>

                <p className="text-sm mt-1">
                  PDF SHA-256 hash against the registered hash.
                </p>
              </div>
            </section>

            {/* Error */}
            {error && (
              <div className="col-span-2 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Result */}
            {result && (
              <section
                className={`col-span-2 rounded-2xl border p-6 ${resultStyles.box}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${resultStyles.icon}`}
                  >
                    {result.result === "AUTHENTIC" ? (
                      <CheckCircle2 size={26} />
                    ) : (
                      <ShieldAlert size={26} />
                    )}
                  </div>

                  <div className="flex-1">
                    <p
                      className={`text-xl font-bold ${resultStyles.text}`}
                    >
                      {getResultTitle()}
                    </p>

                    <p className="text-sm mt-1">
                      {getResultDescription()}
                    </p>

                    <div className="grid grid-cols-4 gap-4 mt-5">
                      <div>
                        <p className="text-xs text-[#6A89A7]">
                          Certificate ID
                        </p>
                        <p className="font-semibold text-sm mt-1">
                          {result.certificateId}
                        </p>
                      </div>

                      {"studentName" in result &&
                        result.studentName && (
                          <div>
                            <p className="text-xs text-[#6A89A7]">
                              Student
                            </p>
                            <p className="font-semibold text-sm mt-1">
                              {result.studentName}
                            </p>
                          </div>
                        )}

                      {"courseName" in result &&
                        result.courseName && (
                          <div>
                            <p className="text-xs text-[#6A89A7]">
                              Course
                            </p>
                            <p className="font-semibold text-sm mt-1">
                              {result.courseName}
                            </p>
                          </div>
                        )}

                      {"issueDate" in result &&
                        result.issueDate && (
                          <div>
                            <p className="text-xs text-[#6A89A7]">
                              Issue Date
                            </p>
                            <p className="font-semibold text-sm mt-1">
                              {result.issueDate}
                            </p>
                          </div>
                        )}
                    </div>

                    {"uploadedHash" in result && (
                      <div className="grid grid-cols-2 gap-4 mt-5">
                        <div>
                          <p className="text-xs text-[#6A89A7]">
                            Uploaded Hash
                          </p>
                          <p className="text-xs font-mono mt-1 break-all">
                            {result.uploadedHash}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-[#6A89A7]">
                            Registered Hash
                          </p>
                          <p className="text-xs font-mono mt-1 break-all">
                            {result.registeredHash}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}