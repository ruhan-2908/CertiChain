package com.certichain.service;

import com.certichain.dto.CertificateResponse;
import com.certichain.dto.CreateCertificateRequest;
import com.certichain.dto.RevokeCertificateResponse;
import com.certichain.entity.Certificate;
import com.certichain.entity.CertificateStatus;
import com.certichain.entity.Student;
import com.certichain.exception.ApiException;
import com.certichain.repository.CertificateRepository;
import com.certichain.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final StudentRepository studentRepository;

    @Transactional
    public CertificateResponse createCertificate(CreateCertificateRequest request) {
        Student student = studentRepository.findById(request.studentId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No student profile found with id " + request.studentId()));

        String certificateId = generateCertificateId();

        // TODO: Replace with the real PDF generation service when that module exists.
        String documentUrl = generatePlaceholderDocumentUrl(certificateId);
        // TODO: Replace with the SHA-256 hash of the generated PDF.
        String documentHash = generatePlaceholderHash(certificateId, request);
        // TODO: Replace with BlockchainService.registerCertificateHash(certificateId, documentHash).
        String blockchainTxHash = "PENDING_BLOCKCHAIN_INTEGRATION";
        String blockchainNetwork = "not-yet-integrated";
        String contractAddress = "not-yet-integrated";

        Certificate certificate = Certificate.builder()
                .certificateId(certificateId)
                .student(student)
                .courseName(request.courseName())
                .issueDate(request.issueDate())
                .documentUrl(documentUrl)
                .documentHash(documentHash)
                .blockchainTxHash(blockchainTxHash)
                .blockchainNetwork(blockchainNetwork)
                .contractAddress(contractAddress)
                .status(CertificateStatus.ACTIVE)
                .build();

        return CertificateResponse.from(certificateRepository.save(certificate));
    }

    @Transactional(readOnly = true)
    public List<CertificateResponse> listAll() {
        return certificateRepository.findAll().stream()
                .map(CertificateResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CertificateResponse getByCertificateId(String certificateId) {
        Certificate certificate = findCertificate(certificateId);
        return CertificateResponse.from(certificate);
    }

    @Transactional(readOnly = true)
    public List<CertificateResponse> getByStudentProfileId(Long studentId) {
        return certificateRepository.findByStudentId(studentId).stream()
                .map(CertificateResponse::from)
                .toList();
    }

    @Transactional
    public RevokeCertificateResponse revoke(String certificateId) {
        Certificate certificate = findCertificate(certificateId);

        if (certificate.getStatus() == CertificateStatus.REVOKED) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Certificate " + certificateId + " is already revoked");
        }

        certificate.setStatus(CertificateStatus.REVOKED);
        certificateRepository.save(certificate);

        // TODO: Also call BlockchainService.revokeCertificate(certificateId) when blockchain integration exists.
        return new RevokeCertificateResponse(certificateId, CertificateStatus.REVOKED.name());
    }

    private Certificate findCertificate(String certificateId) {
        return certificateRepository.findByCertificateId(certificateId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No certificate found with id " + certificateId));
    }

    private String generateCertificateId() {
        int year = LocalDate.now().getYear();
        long sequence = certificateRepository.count() + 1;

        for (int attempt = 0; attempt < 100; attempt++) {
            String certificateId = String.format("CERT-%d-%06d", year, sequence + attempt);
            if (!certificateRepository.existsByCertificateId(certificateId)) {
                return certificateId;
            }
        }

        throw new ApiException(HttpStatus.CONFLICT,
                "Could not generate a unique certificate id");
    }

    private String generatePlaceholderDocumentUrl(String certificateId) {
        return "/files/" + certificateId + ".pdf";
    }

    private String generatePlaceholderHash(String certificateId, CreateCertificateRequest request) {
        String source = certificateId
                + request.studentId()
                + request.courseName()
                + request.issueDate();

        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(source.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm is not available", exception);
        }
    }
}
