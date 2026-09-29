package com.certichain.service;

import com.certichain.dto.VerificationResult;
import com.certichain.entity.Certificate;
import com.certichain.entity.CertificateStatus;
import com.certichain.entity.VerificationLog;
import com.certichain.entity.VerificationMethod;
import com.certichain.repository.CertificateRepository;
import com.certichain.repository.VerificationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationService {

    private final CertificateRepository certificateRepository;
    private final HashingService hashingService;
    private final VerificationLogRepository verificationLogRepository;
    private final BlockchainService blockchainService;

    @Transactional
    public VerificationResult verify(MultipartFile file, String ipAddress) {
        return verify(file, null, ipAddress);
    }

    @Transactional
    public VerificationResult verify(MultipartFile file, String certificateId, String ipAddress) {
        Certificate certificate = null;
        if (certificateId != null && !certificateId.isBlank()) {
            certificate = certificateRepository.findByCertificateId(certificateId.trim()).orElse(null);
        }

        String uploadedHash = hashingService.sha256Hex(file);

        if (certificate == null && (certificateId == null || certificateId.isBlank())) {
            certificate = certificateRepository.findByDocumentHash(uploadedHash).orElse(null);
        }

        if (certificate == null) {
            String loggedCertId = (certificateId != null && !certificateId.isBlank())
                    ? certificateId.trim()
                    : "UNKNOWN";

            verificationLogRepository.save(
                    VerificationLog.builder()
                            .certificateId(loggedCertId)
                            .method(VerificationMethod.FILE_UPLOAD)
                            .result(com.certichain.entity.VerificationResult.NOT_FOUND)
                            .ipAddress(ipAddress)
                            .build()
            );

            return new VerificationResult(
                    "NOT_FOUND",
                    null,
                    null,
                    null,
                    null
            );
        }

        String certId = certificate.getCertificateId();
        String studentName = getStudentName(certificate);

        CertificateRecord record = null;
        try {
            record = blockchainService.getCertificateRecord(certId);
        } catch (Exception exception) {
            log.error("Failed to fetch blockchain record for certificate {}", certId, exception);
        }

        if (record == null || !record.found()) {
            // Blockchain lookup failure or record not found on blockchain -> must not return AUTHENTIC
            verificationLogRepository.save(
                    VerificationLog.builder()
                            .certificateId(certId)
                            .method(VerificationMethod.FILE_UPLOAD)
                            .result(com.certichain.entity.VerificationResult.NOT_FOUND)
                            .ipAddress(ipAddress)
                            .build()
            );

            return new VerificationResult(
                    "NOT_FOUND",
                    null,
                    null,
                    null,
                    null
            );
        }

        // Check if uploaded document hash matches blockchain certificate hash
        if (!hashesMatch(uploadedHash, record.hash())) {
            verificationLogRepository.save(
                    VerificationLog.builder()
                            .certificateId(certId)
                            .method(VerificationMethod.FILE_UPLOAD)
                            .result(com.certichain.entity.VerificationResult.TAMPERED)
                            .ipAddress(ipAddress)
                            .build()
            );

            return new VerificationResult(
                    "TAMPERED",
                    certId,
                    studentName,
                    certificate.getCourseName(),
                    certificate.getIssueDate()
            );
        }

        // Hashes match. Check revocation:
        if (record.revoked() || certificate.getStatus() == CertificateStatus.REVOKED) {
            verificationLogRepository.save(
                    VerificationLog.builder()
                            .certificateId(certId)
                            .method(VerificationMethod.FILE_UPLOAD)
                            .result(com.certichain.entity.VerificationResult.REVOKED)
                            .ipAddress(ipAddress)
                            .build()
            );

            return new VerificationResult(
                    "REVOKED",
                    certId,
                    studentName,
                    certificate.getCourseName(),
                    certificate.getIssueDate()
            );
        }

        // Hashes match, blockchain not revoked, and database status is ACTIVE
        if (certificate.getStatus() == CertificateStatus.ACTIVE) {
            verificationLogRepository.save(
                    VerificationLog.builder()
                            .certificateId(certId)
                            .method(VerificationMethod.FILE_UPLOAD)
                            .result(com.certichain.entity.VerificationResult.AUTHENTIC)
                            .ipAddress(ipAddress)
                            .build()
            );

            return new VerificationResult(
                    "AUTHENTIC",
                    certId,
                    studentName,
                    certificate.getCourseName(),
                    certificate.getIssueDate()
            );
        }

        // Fallback for any other unexpected state
        verificationLogRepository.save(
                VerificationLog.builder()
                        .certificateId(certId)
                        .method(VerificationMethod.FILE_UPLOAD)
                        .result(com.certichain.entity.VerificationResult.NOT_FOUND)
                        .ipAddress(ipAddress)
                        .build()
        );

        return new VerificationResult(
                "NOT_FOUND",
                null,
                null,
                null,
                null
        );
    }

    private String getStudentName(Certificate certificate) {
        if (certificate.getStudent() != null && certificate.getStudent().getUser() != null) {
            return certificate.getStudent().getUser().getFullName();
        }
        return null;
    }

    private boolean hashesMatch(String hash1, String hash2) {
        if (hash1 == null || hash2 == null) {
            return false;
        }
        String clean1 = hash1.startsWith("0x") || hash1.startsWith("0X") ? hash1.substring(2) : hash1;
        String clean2 = hash2.startsWith("0x") || hash2.startsWith("0X") ? hash2.substring(2) : hash2;
        return clean1.equalsIgnoreCase(clean2);
    }
}

