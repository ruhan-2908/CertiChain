export type CertificateStatus = "ACTIVE" | "REVOKED";

export type VerificationResult =
  | "AUTHENTIC"
  | "TAMPERED"
  | "REVOKED"
  | "NOT_FOUND";

export interface CreateCertificateRequest {
  studentId: number;
  courseName: string;
  issueDate: string;
  file: File;
}

export interface Certificate {
  id: number;
  certificateId: string;
  studentId: number;
  studentName: string;
  rollNumber: string;
  courseName: string;
  issueDate: string;
  documentUrl: string;
  documentHash: string;
  blockchainTxHash: string;
  blockchainNetwork: string;
  contractAddress: string;
  status: CertificateStatus;
  supersedesCertificateId: string | null;
  supersededByCertificateId: string | null;
}

export interface RevokeCertificateResponse {
  certificateId: string;
  status: "REVOKED";
}

export interface VerificationResponse {
  result: VerificationResult;
  certificateId: string;
  studentName: string;
  courseName: string;
  issueDate: string;
}