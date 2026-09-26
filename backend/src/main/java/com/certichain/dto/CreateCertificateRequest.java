package com.certichain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateCertificateRequest(
        @NotNull Long studentId,
        @NotBlank String courseName,
        @NotNull LocalDate issueDate
) {}
