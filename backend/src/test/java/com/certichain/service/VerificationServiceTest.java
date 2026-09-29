package com.certichain.service;

import com.certichain.dto.VerificationResult;
import com.certichain.entity.Certificate;
import com.certichain.entity.CertificateStatus;
import com.certichain.entity.Role;
import com.certichain.entity.Student;
import com.certichain.entity.User;
import com.certichain.entity.VerificationLog;
import com.certichain.entity.VerificationMethod;
import com.certichain.exception.ApiException;
import com.certichain.repository.CertificateRepository;
import com.certichain.repository.VerificationLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VerificationServiceTest {

    @Mock
    private CertificateRepository certificateRepository;

    @Mock
    private HashingService hashingService;

    @Mock
    private VerificationLogRepository verificationLogRepository;

    @Mock
    private BlockchainService blockchainService;

    @InjectMocks
    private VerificationService verificationService;

    private Certificate sampleCertificate;
    private final String certId = "CERT-2026-000002";
    private final String originalHash = "aba53c8f06bb772098b936037a299e8ff78bbd0c027ff6d43aef8990f3495fee";
    private final String tamperedHash = "ffffffff06bb772098b936037a299e8ff78bbd0c027ff6d43aef8990f3495fee";
    private final String ipAddress = "192.168.1.100";
    private MockMultipartFile sampleFile;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .id(1L)
                .fullName("Alice Student")
                .email("alice@example.com")
                .role(Role.STUDENT)
                .build();

        Student student = Student.builder()
                .id(1L)
                .user(user)
                .rollNumber("CS-2026-001")
                .department("Computer Science")
                .build();

        sampleCertificate = Certificate.builder()
                .id(2L)
                .certificateId(certId)
                .student(student)
                .courseName("Decentralized Systems & Blockchain")
                .issueDate(LocalDate.of(2026, 9, 29))
                .documentHash(originalHash)
                .documentUrl("/files/CERT-2026-000002.pdf")
                .status(CertificateStatus.ACTIVE)
                .build();

        sampleFile = new MockMultipartFile(
                "file",
                "cert.pdf",
                "application/pdf",
                "dummy pdf content".getBytes()
        );
    }

    @Test
    @DisplayName("Scenario A: Valid certificate + matching blockchain hash + active -> AUTHENTIC")
    void testVerify_ScenarioA_Authentic() {
        when(certificateRepository.findByCertificateId(certId)).thenReturn(Optional.of(sampleCertificate));
        when(hashingService.sha256Hex(sampleFile)).thenReturn(originalHash);

        CertificateRecord blockchainRecord = new CertificateRecord(
                originalHash,
                "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                Instant.now(),
                false, // not revoked
                true   // found
        );
        when(blockchainService.getCertificateRecord(certId)).thenReturn(blockchainRecord);

        VerificationResult result = verificationService.verify(sampleFile, certId, ipAddress);

        assertNotNull(result);
        assertEquals("AUTHENTIC", result.result());
        assertEquals(certId, result.certificateId());
        assertEquals("Alice Student", result.studentName());
        assertEquals("Decentralized Systems & Blockchain", result.courseName());
        assertEquals(LocalDate.of(2026, 9, 29), result.issueDate());

        ArgumentCaptor<VerificationLog> logCaptor = ArgumentCaptor.forClass(VerificationLog.class);
        verify(verificationLogRepository).save(logCaptor.capture());
        VerificationLog log = logCaptor.getValue();
        assertEquals(certId, log.getCertificateId());
        assertEquals(VerificationMethod.FILE_UPLOAD, log.getMethod());
        assertEquals(com.certichain.entity.VerificationResult.AUTHENTIC, log.getResult());
        assertEquals(ipAddress, log.getIpAddress());
    }

    @Test
    @DisplayName("Scenario B: Valid certificate + mismatching uploaded hash -> TAMPERED")
    void testVerify_ScenarioB_Tampered() {
        when(certificateRepository.findByCertificateId(certId)).thenReturn(Optional.of(sampleCertificate));
        when(hashingService.sha256Hex(sampleFile)).thenReturn(tamperedHash);

        CertificateRecord blockchainRecord = new CertificateRecord(
                originalHash,
                "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                Instant.now(),
                false,
                true
        );
        when(blockchainService.getCertificateRecord(certId)).thenReturn(blockchainRecord);

        VerificationResult result = verificationService.verify(sampleFile, certId, ipAddress);

        assertNotNull(result);
        assertEquals("TAMPERED", result.result());
        assertEquals(certId, result.certificateId());
        assertEquals("Alice Student", result.studentName());

        ArgumentCaptor<VerificationLog> logCaptor = ArgumentCaptor.forClass(VerificationLog.class);
        verify(verificationLogRepository).save(logCaptor.capture());
        VerificationLog log = logCaptor.getValue();
        assertEquals(certId, log.getCertificateId());
        assertEquals(VerificationMethod.FILE_UPLOAD, log.getMethod());
        assertEquals(com.certichain.entity.VerificationResult.TAMPERED, log.getResult());
        assertEquals(ipAddress, log.getIpAddress());
    }

    @Test
    @DisplayName("Scenario C: Valid certificate + matching PDF + blockchain revoked=true -> REVOKED")
    void testVerify_ScenarioC_RevokedOnBlockchain() {
        when(certificateRepository.findByCertificateId(certId)).thenReturn(Optional.of(sampleCertificate));
        when(hashingService.sha256Hex(sampleFile)).thenReturn(originalHash);

        CertificateRecord blockchainRecord = new CertificateRecord(
                originalHash,
                "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                Instant.now(),
                true,  // revoked on blockchain
                true   // found
        );
        when(blockchainService.getCertificateRecord(certId)).thenReturn(blockchainRecord);

        VerificationResult result = verificationService.verify(sampleFile, certId, ipAddress);

        assertNotNull(result);
        assertEquals("REVOKED", result.result());
        assertEquals(certId, result.certificateId());

        ArgumentCaptor<VerificationLog> logCaptor = ArgumentCaptor.forClass(VerificationLog.class);
        verify(verificationLogRepository).save(logCaptor.capture());
        VerificationLog log = logCaptor.getValue();
        assertEquals(certId, log.getCertificateId());
        assertEquals(VerificationMethod.FILE_UPLOAD, log.getMethod());
        assertEquals(com.certichain.entity.VerificationResult.REVOKED, log.getResult());
        assertEquals(ipAddress, log.getIpAddress());
    }

    @Test
    @DisplayName("Scenario C2: Valid certificate + matching PDF + database REVOKED -> REVOKED")
    void testVerify_ScenarioC_RevokedInDatabase() {
        sampleCertificate.setStatus(CertificateStatus.REVOKED);
        when(certificateRepository.findByCertificateId(certId)).thenReturn(Optional.of(sampleCertificate));
        when(hashingService.sha256Hex(sampleFile)).thenReturn(originalHash);

        CertificateRecord blockchainRecord = new CertificateRecord(
                originalHash,
                "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                Instant.now(),
                false,
                true
        );
        when(blockchainService.getCertificateRecord(certId)).thenReturn(blockchainRecord);

        VerificationResult result = verificationService.verify(sampleFile, certId, ipAddress);

        assertNotNull(result);
        assertEquals("REVOKED", result.result());
        assertEquals(certId, result.certificateId());

        ArgumentCaptor<VerificationLog> logCaptor = ArgumentCaptor.forClass(VerificationLog.class);
        verify(verificationLogRepository).save(logCaptor.capture());
        VerificationLog log = logCaptor.getValue();
        assertEquals(com.certichain.entity.VerificationResult.REVOKED, log.getResult());
    }

    @Test
    @DisplayName("Scenario D: Unknown certificate ID -> NOT_FOUND")
    void testVerify_ScenarioD_UnknownCertificateId() {
        String unknownCertId = "CERT-9999-999999";
        when(certificateRepository.findByCertificateId(unknownCertId)).thenReturn(Optional.empty());
        when(hashingService.sha256Hex(sampleFile)).thenReturn(originalHash);

        VerificationResult result = verificationService.verify(sampleFile, unknownCertId, ipAddress);

        assertNotNull(result);
        assertEquals("NOT_FOUND", result.result());
        assertNull(result.certificateId());

        ArgumentCaptor<VerificationLog> logCaptor = ArgumentCaptor.forClass(VerificationLog.class);
        verify(verificationLogRepository).save(logCaptor.capture());
        VerificationLog log = logCaptor.getValue();
        assertEquals(unknownCertId, log.getCertificateId());
        assertEquals(VerificationMethod.FILE_UPLOAD, log.getMethod());
        assertEquals(com.certichain.entity.VerificationResult.NOT_FOUND, log.getResult());
        assertEquals(ipAddress, log.getIpAddress());

        verify(blockchainService, never()).getCertificateRecord(any());
    }

    @Test
    @DisplayName("Scenario E1: Blockchain record not found -> NOT_FOUND (must not return AUTHENTIC)")
    void testVerify_ScenarioE_RecordNotFoundOnChain() {
        when(certificateRepository.findByCertificateId(certId)).thenReturn(Optional.of(sampleCertificate));
        when(hashingService.sha256Hex(sampleFile)).thenReturn(originalHash);

        CertificateRecord notFoundRecord = new CertificateRecord(null, null, null, false, false);
        when(blockchainService.getCertificateRecord(certId)).thenReturn(notFoundRecord);

        VerificationResult result = verificationService.verify(sampleFile, certId, ipAddress);

        assertNotNull(result);
        assertNotEquals("AUTHENTIC", result.result());
        assertEquals("NOT_FOUND", result.result());

        ArgumentCaptor<VerificationLog> logCaptor = ArgumentCaptor.forClass(VerificationLog.class);
        verify(verificationLogRepository).save(logCaptor.capture());
        VerificationLog log = logCaptor.getValue();
        assertEquals(com.certichain.entity.VerificationResult.NOT_FOUND, log.getResult());
    }

    @Test
    @DisplayName("Scenario E2: Blockchain lookup exception -> NOT_FOUND (must not return AUTHENTIC)")
    void testVerify_ScenarioE_BlockchainLookupException() {
        when(certificateRepository.findByCertificateId(certId)).thenReturn(Optional.of(sampleCertificate));
        when(hashingService.sha256Hex(sampleFile)).thenReturn(originalHash);

        when(blockchainService.getCertificateRecord(certId))
                .thenThrow(new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Blockchain node connection refused"));

        VerificationResult result = verificationService.verify(sampleFile, certId, ipAddress);

        assertNotNull(result);
        assertNotEquals("AUTHENTIC", result.result());
        assertEquals("NOT_FOUND", result.result());

        ArgumentCaptor<VerificationLog> logCaptor = ArgumentCaptor.forClass(VerificationLog.class);
        verify(verificationLogRepository).save(logCaptor.capture());
        VerificationLog log = logCaptor.getValue();
        assertEquals(com.certichain.entity.VerificationResult.NOT_FOUND, log.getResult());
    }
}
