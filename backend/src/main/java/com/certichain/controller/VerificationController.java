
package com.certichain.controller;

import com.certichain.dto.VerificationResult;
import com.certichain.service.VerificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/verify")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping("/upload")
    public ResponseEntity<VerificationResult> verify(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "certificateId", required = false) String certificateId,
            HttpServletRequest request) {

        String ipAddress = request.getRemoteAddr();

        return ResponseEntity.ok(
                verificationService.verify(file, certificateId, ipAddress)
        );
    }
}

