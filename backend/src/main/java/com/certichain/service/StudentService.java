package com.certichain.service;

import com.certichain.dto.CreateStudentRequest;
import com.certichain.dto.StudentResponse;
import com.certichain.entity.Role;
import com.certichain.entity.Student;
import com.certichain.entity.User;
import com.certichain.exception.ApiException;
import com.certichain.repository.StudentRepository;
import com.certichain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    @Transactional
    public StudentResponse createStudentProfile(CreateStudentRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No user found with id " + request.userId()));

        if (user.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "User " + user.getEmail() + " does not have the STUDENT role");
        }

        if (studentRepository.existsByUserId(user.getId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "A student profile already exists for this user");
        }

        if (studentRepository.existsByRollNumber(request.rollNumber())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Roll number " + request.rollNumber() + " is already in use");
        }

        Student student = Student.builder()
                .user(user)
                .rollNumber(request.rollNumber())
                .department(request.department())
                .batchYear(request.batchYear())
                .build();

        return StudentResponse.from(studentRepository.save(student));
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> listAllStudents() {
        return studentRepository.findAll().stream()
                .map(StudentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentResponse getById(Long studentProfileId) {
        Student student = studentRepository.findById(studentProfileId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No student profile found with id " + studentProfileId));
        return StudentResponse.from(student);
    }

    /** Used for the "my profile" endpoint — looks up by the logged-in user's own id. */
    @Transactional(readOnly = true)
    public StudentResponse getByUserId(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No student profile exists yet for this account"));
        return StudentResponse.from(student);
    }

    @Transactional
    public void deleteStudentProfile(Long studentProfileId) {
        if (!studentRepository.existsById(studentProfileId)) {
            throw new ApiException(HttpStatus.NOT_FOUND,
                    "No student profile found with id " + studentProfileId);
        }
        studentRepository.deleteById(studentProfileId);
    }
}
