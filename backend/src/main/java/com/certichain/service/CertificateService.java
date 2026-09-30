package com.certichain.service;

import com.certichain.dto.CertificateResponse;
import com.certichain.dto.RevokeCertificateResponse;
import com.certichain.entity.Certificate;
import com.certichain.entity.CertificateStatus;
import com.certichain.entity.Role;
import com.certichain.entity.Student;
import com.certichain.entity.User;
import com.certichain.exception.ApiException;
import com.certichain.repository.CertificateRepository;
import com.certichain.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final StudentRepository studentRepository;
    private final HashingService hashingService;
    private final FileStorageService fileStorageService;
    private final BlockchainService blockchainService;

    @Value("${certichain.blockchain.contract-address}")
    private String contractAddress;

    private static final String BLOCKCHAIN_NETWORK = "sepolia";

    @Transactional
    public CertificateResponse createCertificate(Long studentId, String courseName,
                                                 LocalDate issueDate, MultipartFile file) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No student profile found with id " + studentId));

        return CertificateResponse.from(issueCertificate(student, courseName, issueDate, file, null));
    }

    private Certificate issueCertificate(Student student, String courseName,
                                         LocalDate issueDate, MultipartFile file,
                                         String supersedesCertificateId) {
        String certificateId = generateCertificateId();
        String documentHash = hashingService.sha256Hex(file);
        String documentUrl = fileStorageService.store(file, certificateId);

        String blockchainTxHash;
        try {
            blockchainTxHash = blockchainService.registerCertificateHash(certificateId, documentHash);
        } catch (Exception exception) {
            fileStorageService.delete(certificateId);
            throw exception;
        }

        Certificate certificate = Certificate.builder()
                .certificateId(certificateId)
                .student(student)
                .courseName(courseName)
                .issueDate(issueDate)
                .documentUrl(documentUrl)
                .documentHash(documentHash)
                .blockchainTxHash(blockchainTxHash)
                .blockchainNetwork(BLOCKCHAIN_NETWORK)
                .contractAddress(contractAddress)
                .status(CertificateStatus.ACTIVE)
                .supersedesCertificateId(supersedesCertificateId)
                .build();

            return certificateRepository.save(certificate);
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

    @Transactional(readOnly = true)
    public byte[] getFileBytes(String certificateId, User user) {
        Certificate certificate = findCertificate(certificateId);
        boolean owner = certificate.getStudent().getUser().getId().equals(user.getId());
        if (user.getRole() != Role.ADMIN && !owner) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have access to this file");
        }
        return fileStorageService.loadAsBytes(certificateId);
    }

    @Transactional
    public CertificateResponse replaceCertificate(String oldCertificateId, String courseName,
                                                   LocalDate issueDate, MultipartFile newFile) {
        Certificate oldCertificate = findCertificate(oldCertificateId);
        if (oldCertificate.getStatus() == CertificateStatus.REVOKED) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cannot replace a certificate that is already revoked");
        }

        Certificate newCertificate = issueCertificate(oldCertificate.getStudent(), courseName,
                issueDate, newFile, oldCertificateId);
        oldCertificate.setStatus(CertificateStatus.REVOKED);
        oldCertificate.setSupersededByCertificateId(newCertificate.getCertificateId());
        certificateRepository.save(oldCertificate);

        // TODO: Revoke the old on-chain record via BlockchainService.revokeCertificate(...).
        return CertificateResponse.from(newCertificate);
    }

    @Transactional
    public RevokeCertificateResponse revoke(String certificateId) {
        Certificate certificate = findCertificate(certificateId);

        if (certificate.getStatus() == CertificateStatus.REVOKED) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Certificate " + certificateId + " is already revoked");
        }

        blockchainService.revokeCertificate(certificateId);

        certificate.setStatus(CertificateStatus.REVOKED);
        certificateRepository.save(certificate);

        return new RevokeCertificateResponse(certificateId, CertificateStatus.REVOKED.name());
    }

    @Transactional
    public void deleteCertificate(String certificateId) {
        Certificate certificate = findCertificate(certificateId);
        certificateRepository.delete(certificate);
        // Blockchain records cannot be removed. Revoke instead if the certificate may be in circulation.
        fileStorageService.delete(certificateId);
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

}
