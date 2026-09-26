package com.certichain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Institution-specific profile for a STUDENT-role User.
 * A User is the login account; a Student is the academic record
 * that certificates will actually be issued against.
 */
@Entity
@Table(name = "students", uniqueConstraints = {
        @UniqueConstraint(columnNames = "roll_number"),
        @UniqueConstraint(columnNames = "user_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One student profile belongs to exactly one User account (role = STUDENT).
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "roll_number", nullable = false, unique = true)
    private String rollNumber;

    @Column(nullable = false)
    private String department;

    @Column(name = "batch_year", nullable = false)
    private Integer batchYear;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
