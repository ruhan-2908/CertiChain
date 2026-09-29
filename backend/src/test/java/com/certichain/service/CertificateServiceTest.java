package com.certichain.service;

import com.certichain.dto.CertificateResponse;
import com.certichain.entity.Certificate;
import com.certichain.entity.CertificateStatus;
import com.certichain.entity.Role;
import com.certichain.entity.Student;
import com.certichain.entity.User;
import com.certichain.exception.ApiException;
import com.certichain.repository.CertificateRepository;
import com.certichain.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CertificateServiceTest {

    @Mock
    private CertificateRepository certificateRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private HashingService hashingService;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private BlockchainService blockchainService;

    private CertificateService certificateService;

    private Student student;
    private final String contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    @BeforeEach
    void setUp() {
        certificateService = new CertificateService(
                certificateRepository,
                studentRepository,
                hashingService,
                fileStorageService,
                blockchainService
        );
        ReflectionTestUtils.setField(certificateService, "contractAddress", contractAddress);

        User user = User.builder()
                .id(1L)
                .email("student@example.com")
                .fullName("Alice Student")
                .role(Role.STUDENT)
                .build();

        student = Student.builder()
                .id(1L)
                .user(user)
                .rollNumber("CS-2026-001")
                .department("Computer Science")
                .build();
    }

    @Test
    @DisplayName("Successfully creates certificate and registers hash on blockchain")
    void testCreateCertificate_Success() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "cert.pdf", "application/pdf", "dummy pdf content".getBytes()
        );
        String mockHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        String mockTxHash = "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef";

        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(hashingService.sha256Hex(file)).thenReturn(mockHash);
        when(fileStorageService.store(eq(file), anyString())).thenReturn("/files/CERT-2026-000002.pdf");
        when(blockchainService.registerCertificateHash(anyString(), eq(mockHash))).thenReturn(mockTxHash);

        ArgumentCaptor<Certificate> certCaptor = ArgumentCaptor.forClass(Certificate.class);
        when(certificateRepository.save(certCaptor.capture())).thenAnswer(invocation -> {
            Certificate c = invocation.getArgument(0);
            c.setId(10L);
            return c;
        });

        CertificateResponse response = certificateService.createCertificate(
                1L, "Blockchain Engineering", LocalDate.of(2026, 5, 20), file
        );

        assertNotNull(response);
        assertEquals(mockTxHash, response.blockchainTxHash());
        assertEquals("hardhat-local", response.blockchainNetwork());
        assertEquals(contractAddress, response.contractAddress());
        assertEquals(mockHash, response.documentHash());
        assertEquals("ACTIVE", response.status());

        Certificate saved = certCaptor.getValue();
        assertEquals(mockTxHash, saved.getBlockchainTxHash());
        assertEquals("hardhat-local", saved.getBlockchainNetwork());
        assertEquals(contractAddress, saved.getContractAddress());
        assertEquals(mockHash, saved.getDocumentHash());

        verify(blockchainService).registerCertificateHash(saved.getCertificateId(), mockHash);
        verify(certificateRepository).save(any(Certificate.class));
        verify(fileStorageService, never()).delete(anyString());
    }

    @Test
    @DisplayName("Fails certificate creation if blockchain registration fails, cleans up file and does not save certificate")
    void testCreateCertificate_BlockchainFailure_CleansUpAndFails() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "cert.pdf", "application/pdf", "dummy pdf content".getBytes()
        );
        String mockHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(hashingService.sha256Hex(file)).thenReturn(mockHash);
        when(fileStorageService.store(eq(file), anyString())).thenReturn("/files/temp.pdf");
        when(blockchainService.registerCertificateHash(anyString(), eq(mockHash)))
                .thenThrow(new ApiException(HttpStatus.BAD_GATEWAY, "Smart contract call reverted"));

        ApiException thrown = assertThrows(ApiException.class, () ->
                certificateService.createCertificate(
                        1L, "Blockchain Engineering", LocalDate.of(2026, 5, 20), file
                )
        );

        assertEquals(HttpStatus.BAD_GATEWAY, thrown.getStatus());
        assertEquals("Smart contract call reverted", thrown.getMessage());

        // Verify cleanup happened and certificate was NEVER saved
        verify(fileStorageService).delete(anyString());
        verify(certificateRepository, never()).save(any(Certificate.class));
    }

    @Test
    @DisplayName("Successfully revokes certificate on blockchain and updates database status to REVOKED")
    void testRevokeCertificate_Success() {
        String certificateId = "CERT-2026-000002";
        Certificate cert = Certificate.builder()
                .id(1L)
                .certificateId(certificateId)
                .student(student)
                .status(CertificateStatus.ACTIVE)
                .build();

        when(certificateRepository.findByCertificateId(certificateId)).thenReturn(Optional.of(cert));

        var response = certificateService.revoke(certificateId);

        assertNotNull(response);
        assertEquals(certificateId, response.certificateId());
        assertEquals("REVOKED", response.status());
        assertEquals(CertificateStatus.REVOKED, cert.getStatus());

        verify(blockchainService).revokeCertificate(certificateId);
        verify(certificateRepository).save(cert);
    }

    @Test
    @DisplayName("Fails revocation when blockchain call fails, preserves ACTIVE status, does not save")
    void testRevokeCertificate_BlockchainFailure_PreservesStatus() {
        String certificateId = "CERT-2026-000002";
        Certificate cert = Certificate.builder()
                .id(1L)
                .certificateId(certificateId)
                .student(student)
                .status(CertificateStatus.ACTIVE)
                .build();

        when(certificateRepository.findByCertificateId(certificateId)).thenReturn(Optional.of(cert));
        doThrow(new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Blockchain unavailable"))
                .when(blockchainService).revokeCertificate(certificateId);

        ApiException thrown = assertThrows(ApiException.class, () ->
                certificateService.revoke(certificateId)
        );

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, thrown.getStatus());
        assertEquals("Blockchain unavailable", thrown.getMessage());
        assertEquals(CertificateStatus.ACTIVE, cert.getStatus());

        verify(blockchainService).revokeCertificate(certificateId);
        verify(certificateRepository, never()).save(any(Certificate.class));
    }

    @Test
    @DisplayName("Throws CONFLICT and avoids blockchain call when certificate is already REVOKED")
    void testRevokeCertificate_AlreadyRevoked_NoBlockchainCall() {
        String certificateId = "CERT-2026-000002";
        Certificate cert = Certificate.builder()
                .id(1L)
                .certificateId(certificateId)
                .student(student)
                .status(CertificateStatus.REVOKED)
                .build();

        when(certificateRepository.findByCertificateId(certificateId)).thenReturn(Optional.of(cert));

        ApiException thrown = assertThrows(ApiException.class, () ->
                certificateService.revoke(certificateId)
        );

        assertEquals(HttpStatus.CONFLICT, thrown.getStatus());
        assertTrue(thrown.getMessage().contains("already revoked"));

        verify(blockchainService, never()).revokeCertificate(anyString());
        verify(certificateRepository, never()).save(any(Certificate.class));
    }
}
