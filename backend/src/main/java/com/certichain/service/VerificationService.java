package com.certichain.service;

import com.certichain.dto.VerificationResult;
import com.certichain.entity.Certificate;
import com.certichain.entity.CertificateStatus;
import com.certichain.repository.CertificateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private final CertificateRepository certificateRepository;
    private final HashingService hashingService;

    @Transactional(readOnly = true)
    public VerificationResult verify(MultipartFile file) {
        String hash = hashingService.sha256Hex(file);
        Certificate certificate = certificateRepository.findByDocumentHash(hash).orElse(null);

        if (certificate == null) {
            // TODO: Log FILE_UPLOAD / NOT_FOUND when verification logs are added.
            return new VerificationResult("NOT_FOUND", null, null, null, null);
        }

        String result = certificate.getStatus() == CertificateStatus.REVOKED
                ? "REVOKED"
                : "AUTHENTIC";
        // TODO: Log FILE_UPLOAD and the result when verification logs are added.
        return new VerificationResult(
                result,
                certificate.getCertificateId(),
                certificate.getStudent().getUser().getFullName(),
                certificate.getCourseName(),
                certificate.getIssueDate());
    }
}
