import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FilePlus2 } from "lucide-react";
import { createCertificate } from "../../services/api";

export default function IssueCertificate() {
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [issueDate, setIssueDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccess("");
    setError("");

    if (!studentId || !courseName || !issueDate) {
      setError("Please fill in all fields.");
      return;
    }

    const parsedStudentId = Number(studentId);

    if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
      setError("Student ID must be a valid positive number.");
      return;
    }

    try {
      setLoading(true);

      const certificate = await createCertificate({
        studentId: parsedStudentId,
        courseName: courseName.trim(),
        issueDate,
      });

      setSuccess(
        `Certificate ${certificate.certificateId} was issued successfully.`,
      );

      setStudentId("");
      setCourseName("");
      setIssueDate("");
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
    <div className="min-h-screen bg-[#f8fbff] text-[#384959] overflow-hidden">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="h-20 shrink-0 bg-white border-b border-[#BDDDFC] flex items-center justify-between px-8">
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
              <h1 className="text-2xl font-bold text-[#384959]">
                Issue Certificate
              </h1>
              <p className="text-sm text-[#6A89A7]">
                Create a new blockchain-verified certificate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#6A89A7]">
            <FilePlus2 size={19} />
            Certificate Issuance
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-2xl">
            <div className="bg-white border border-[#BDDDFC] rounded-2xl shadow-sm p-8">
              <div className="mb-7">
                <h2 className="text-xl font-semibold text-[#384959]">
                  Certificate Details
                </h2>

                <p className="mt-1 text-sm text-[#6A89A7]">
                  Enter the student and course information. The backend will
                  generate the certificate PDF, QR code, hash and blockchain
                  record automatically.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Student ID */}
                <div>
                  <label
                    htmlFor="studentId"
                    className="block text-sm font-semibold mb-2 text-[#384959]"
                  >
                    Student ID
                  </label>

                  <input
                    id="studentId"
                    type="number"
                    min="1"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter student ID"
                    className="w-full h-12 rounded-xl border border-[#BDDDFC] px-4 outline-none focus:border-[#6A89A7] focus:ring-2 focus:ring-[#88BDF2]/30"
                    disabled={loading}
                  />
                </div>

                {/* Course */}
                <div>
                  <label
                    htmlFor="courseName"
                    className="block text-sm font-semibold mb-2 text-[#384959]"
                  >
                    Course Name
                  </label>

                  <input
                    id="courseName"
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="Example: B.Tech Computer Science"
                    className="w-full h-12 rounded-xl border border-[#BDDDFC] px-4 outline-none focus:border-[#6A89A7] focus:ring-2 focus:ring-[#88BDF2]/30"
                    disabled={loading}
                  />
                </div>

                {/* Issue Date */}
                <div>
                  <label
                    htmlFor="issueDate"
                    className="block text-sm font-semibold mb-2 text-[#384959]"
                  >
                    Issue Date
                  </label>

                  <input
                    id="issueDate"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full h-12 rounded-xl border border-[#BDDDFC] px-4 outline-none focus:border-[#6A89A7] focus:ring-2 focus:ring-[#88BDF2]/30"
                    disabled={loading}
                  />
                </div>

                {/* Success */}
                {success && (
                  <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 text-sm">
                    <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-[#384959] hover:bg-[#2f3e4c] disabled:opacity-60 disabled:cursor-not-allowed font-semibold transition"
                  style={{ color: "#ffffff" }}
                >
                  {loading ? "Issuing Certificate..." : "Issue Certificate"}
                </button>
              </form>
            </div>

            {/* Backend flow information */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="bg-white border border-[#BDDDFC] rounded-xl p-4 text-center">
                <p className="text-xs text-[#6A89A7]">Step 1</p>
                <p className="font-semibold text-sm mt-1">
                  Generate PDF
                </p>
              </div>

              <div className="bg-white border border-[#BDDDFC] rounded-xl p-4 text-center">
                <p className="text-xs text-[#6A89A7]">Step 2</p>
                <p className="font-semibold text-sm mt-1">
                  Create Hash
                </p>
              </div>

              <div className="bg-white border border-[#BDDDFC] rounded-xl p-4 text-center">
                <p className="text-xs text-[#6A89A7]">Step 3</p>
                <p className="font-semibold text-sm mt-1">
                  Register Blockchain
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}