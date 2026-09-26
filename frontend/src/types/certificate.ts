export type CertificateStatus =
  | "ACTIVE"
  | "REVOKED";

export type VerificationResult =
  | "AUTHENTIC"
  | "TAMPERED"
  | "REVOKED"
  | "NOT_FOUND";

export interface CreateCertificateRequest {
  studentId: number;
  courseName: string;
  issueDate: string;
}

export interface Certificate {
  certificateId: string;
  studentId: number;
  studentName: string;
  courseName: string;
  issueDate: string;
  documentUrl: string;
  documentHash: string;
  blockchainTxHash: string;
  blockchainNetwork: string;
  contractAddress: string;
  status: CertificateStatus;
}

export interface RevokeCertificateResponse {
  certificateId: string;
  status: "REVOKED";
}

export interface VerifyCertificateResponse {
  certificateId: string;
  result: VerificationResult;
  studentName?: string;
  courseName?: string;
  issueDate?: string;
}

export interface VerifyUploadResponse {
  certificateId: string;
  result: VerificationResult;
  uploadedHash: string;
  registeredHash: string;
}