package com.certichain.controller;

import com.certichain.dto.CreateStudentRequest;
import com.certichain.dto.StudentResponse;
import com.certichain.entity.User;
import com.certichain.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    /** Admin creates a student profile for an existing STUDENT-role user account. */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentResponse> createStudentProfile(@Valid @RequestBody CreateStudentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.createStudentProfile(request));
    }

    /** Admin: list every student profile (used for the "issue certificate" dropdown, etc.). */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StudentResponse>> listAll() {
        return ResponseEntity.ok(studentService.listAllStudents());
    }

    /** Admin: look up one student profile by its id. */
    @GetMapping("/{studentProfileId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentResponse> getById(@PathVariable Long studentProfileId) {
        return ResponseEntity.ok(studentService.getById(studentProfileId));
    }

    /** Student: view their own profile. Any logged-in student can call this, no id needed. */
    @GetMapping("/me")
    public ResponseEntity<StudentResponse> getMyProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(studentService.getByUserId(user.getId()));
    }

    /** Admin: remove a student profile. */
    @DeleteMapping("/{studentProfileId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long studentProfileId) {
        studentService.deleteStudentProfile(studentProfileId);
        return ResponseEntity.noContent().build();
    }
}
