package com.certichain.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateStudentRequest(
        @NotNull Long userId,          // must already exist and have role = STUDENT
        @NotBlank String rollNumber,
        @NotBlank String department,
        @NotNull @Min(2000) Integer batchYear
) {}
