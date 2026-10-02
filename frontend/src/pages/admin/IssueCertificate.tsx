import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { createCertificate } from "../../services/api";

export default function IssueCertificate() {
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!studentId.trim()) {
      setError("Please enter the student ID.");
      return;
    }

    if (!courseName.trim()) {
      setError("Please enter the course name.");
      return;
    }

    if (!issueDate) {
      setError("Please select the issue date.");
      return;
    }

    if (!file) {
      setError("Please upload the certificate PDF.");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }

    setLoading(true);

    try {
      const certificate = await createCertificate(
        Number(studentId),
        courseName.trim(),
        issueDate,
        file,
      );

      setSuccess(
        `Certificate ${certificate.certificateId} was issued successfully.`,
      );

      setStudentId("");
      setCourseName("");
      setIssueDate("");
      setFile(null);

      const fileInput = document.getElementById(
        "certificate-file",
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to issue certificate.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f8fbff] text-[#384959]">
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-[#BDDDFC] bg-[#384959] text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#88BDF2]">
                <span className="font-black text-[#384959]">
                  C
                </span>
              </div>

              <div>
                <h1 className="text-lg font-bold">
                  CertiChain
                </h1>
                <p className="text-xs text-white/60">
                  Admin Portal
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            <button
              type="button"
              onClick={() =>
                navigate("/admin/dashboard")
              }
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/issue")
              }
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm font-semibold text-white"
            >
              Issue Certificate
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/certificates")
              }
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Certificates
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/logs")
              }
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Verification Logs
            </button>
          </nav>

          <div className="border-t border-white/10 p-4">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(
                  "certichain_token",
                );
                localStorage.removeItem(
                  "certichain_role",
                );
                localStorage.removeItem(
                  "certichain_user",
                );
                navigate("/login");
              }}
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            {/* Header */}
            <header className="flex h-20 shrink-0 items-center justify-between border-b border-[#BDDDFC] bg-white px-6 lg:px-8">
              <div>
                <h2 className="text-2xl font-bold">
                  Issue Certificate
                </h2>
                <p className="mt-1 text-sm text-[#6A89A7]">
                  Upload a certificate PDF and register it
                  on the blockchain.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/dashboard")
                }
                className="flex items-center gap-2 rounded-xl border border-[#BDDDFC] bg-white px-4 py-2.5 text-sm font-semibold text-[#384959] transition hover:bg-[#f8fbff]"
              >
                <ArrowLeft size={17} />
                Dashboard
              </button>
            </header>

            {/* Content */}
            <section className="flex-1 overflow-auto p-6 lg:p-8">
              <div className="mx-auto max-w-4xl">
                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-[#BDDDFC] bg-white p-6 shadow-sm lg:p-8"
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Student ID */}
                    <div>
                      <label
                        htmlFor="student-id"
                        className="mb-2 block text-sm font-semibold"
                      >
                        Student ID
                      </label>

                      <input
                        id="student-id"
                        type="number"
                        value={studentId}
                        onChange={(event) =>
                          setStudentId(
                            event.target.value,
                          )
                        }
                        placeholder="Enter student ID"
                        className="w-full rounded-xl border border-[#BDDDFC] px-4 py-3 text-sm outline-none transition focus:border-[#6A89A7] focus:ring-2 focus:ring-[#88BDF2]/30"
                      />
                    </div>

                    {/* Course */}
                    <div>
                      <label
                        htmlFor="course-name"
                        className="mb-2 block text-sm font-semibold"
                      >
                        Course Name
                      </label>

                      <input
                        id="course-name"
                        type="text"
                        value={courseName}
                        onChange={(event) =>
                          setCourseName(
                            event.target.value,
                          )
                        }
                        placeholder="e.g. Bachelor of Computer Science"
                        className="w-full rounded-xl border border-[#BDDDFC] px-4 py-3 text-sm outline-none transition focus:border-[#6A89A7] focus:ring-2 focus:ring-[#88BDF2]/30"
                      />
                    </div>

                    {/* Issue date */}
                    <div>
                      <label
                        htmlFor="issue-date"
                        className="mb-2 block text-sm font-semibold"
                      >
                        Issue Date
                      </label>

                      <input
                        id="issue-date"
                        type="date"
                        value={issueDate}
                        onChange={(event) =>
                          setIssueDate(
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-[#BDDDFC] px-4 py-3 text-sm outline-none transition focus:border-[#6A89A7] focus:ring-2 focus:ring-[#88BDF2]/30"
                      />
                    </div>

                    {/* File */}
                    <div>
                      <label
                        htmlFor="certificate-file"
                        className="mb-2 block text-sm font-semibold"
                      >
                        Certificate PDF
                      </label>

                      <label
                        htmlFor="certificate-file"
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#6A89A7] bg-[#f8fbff] px-4 py-3 transition hover:bg-[#BDDDFC]/30"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#BDDDFC]/60 text-[#384959]">
                          <Upload size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {file
                              ? file.name
                              : "Choose PDF file"}
                          </p>

                          <p className="text-xs text-[#6A89A7]">
                            PDF only
                          </p>
                        </div>
                      </label>

                      <input
                        id="certificate-file"
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
                  </div>

                  {/* Information */}
                  <div className="mt-6 rounded-xl bg-[#BDDDFC]/30 p-4">
                    <div className="flex gap-3">
                      <FileText
                        size={20}
                        className="mt-0.5 shrink-0 text-[#6A89A7]"
                      />

                      <div>
                        <p className="text-sm font-semibold">
                          Blockchain registration
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#6A89A7]">
                          The backend will generate the
                          certificate ID, calculate the
                          document hash, register the hash
                          on the blockchain, and store the
                          certificate metadata.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Success */}
                  {success && (
                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0"
                      />
                      <span>{success}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="mt-7 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-xl bg-[#384959] px-6 py-3 text-sm font-semibold transition hover:bg-[#6A89A7] disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        color: "#ffffff",
                      }}
                    >
                      {loading
                        ? "Issuing Certificate..."
                        : "Issue Certificate"}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}