package com.certichain.controller;

import com.certichain.dto.CertificateResponse;
import com.certichain.dto.RevokeCertificateResponse;
import com.certichain.entity.User;
import com.certichain.exception.ApiException;
import com.certichain.repository.StudentRepository;
import com.certichain.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;
    private final StudentRepository studentRepository;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CertificateResponse> create(
            @RequestParam Long studentId,
            @RequestParam String courseName,
            @RequestParam LocalDate issueDate,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(certificateService.createCertificate(studentId, courseName, issueDate, file));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CertificateResponse>> listAll() {
        return ResponseEntity.ok(certificateService.listAll());
    }

    @GetMapping("/{certificateId}")
    public ResponseEntity<CertificateResponse> getByCertificateId(@PathVariable String certificateId) {
        return ResponseEntity.ok(certificateService.getByCertificateId(certificateId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<CertificateResponse>> getMyCertificates(
            @AuthenticationPrincipal User user
    ) {
        Long studentProfileId = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No student profile exists yet for this account"))
                .getId();

        return ResponseEntity.ok(certificateService.getByStudentProfileId(studentProfileId));
    }

    @GetMapping("/{certificateId}/file")
    public ResponseEntity<byte[]> download(@PathVariable String certificateId,
                                            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .body(certificateService.getFileBytes(certificateId, user));
    }

    @PutMapping("/{certificateId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CertificateResponse> replace(
            @PathVariable String certificateId,
            @RequestParam String courseName,
            @RequestParam LocalDate issueDate,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(certificateService.replaceCertificate(certificateId, courseName, issueDate, file));
    }

    @DeleteMapping("/{certificateId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String certificateId) {
        certificateService.deleteCertificate(certificateId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{certificateId}/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RevokeCertificateResponse> revoke(@PathVariable String certificateId) {
        return ResponseEntity.ok(certificateService.revoke(certificateId));
    }
}
