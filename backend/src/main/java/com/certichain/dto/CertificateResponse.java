package com.certichain.dto;

import com.certichain.entity.Certificate;

import java.time.LocalDate;

public record CertificateResponse(
        Long id,
        String certificateId,
        Long studentId,
        String studentName,
        String rollNumber,
        String courseName,
        LocalDate issueDate,
        String documentUrl,
        String documentHash,
        String blockchainTxHash,
        String blockchainNetwork,
        String contractAddress,
        String status
) {
    public static CertificateResponse from(Certificate certificate) {
        return new CertificateResponse(
                certificate.getId(),
                certificate.getCertificateId(),
                certificate.getStudent().getId(),
                certificate.getStudent().getUser().getFullName(),
                certificate.getStudent().getRollNumber(),
                certificate.getCourseName(),
                certificate.getIssueDate(),
                certificate.getDocumentUrl(),
                certificate.getDocumentHash(),
                certificate.getBlockchainTxHash(),
                certificate.getBlockchainNetwork(),
                certificate.getContractAddress(),
                certificate.getStatus().name()
        );
    }
}
