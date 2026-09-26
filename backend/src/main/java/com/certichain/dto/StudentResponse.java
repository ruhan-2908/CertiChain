package com.certichain.dto;

import com.certichain.entity.Student;

public record StudentResponse(
        Long studentProfileId,
        Long userId,
        String fullName,
        String email,
        String rollNumber,
        String department,
        Integer batchYear
) {
    public static StudentResponse from(Student student) {
        return new StudentResponse(
                student.getId(),
                student.getUser().getId(),
                student.getUser().getFullName(),
                student.getUser().getEmail(),
                student.getRollNumber(),
                student.getDepartment(),
                student.getBatchYear()
        );
    }
}
