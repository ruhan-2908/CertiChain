package com.certichain.dto;

import java.time.LocalDate;

public record VerificationResult(
        String result,
        String certificateId,
        String studentName,
        String courseName,
        LocalDate issueDate
) {
}
