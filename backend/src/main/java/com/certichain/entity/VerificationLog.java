
package com.certichain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "verification_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String certificateId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationResult result;

    @Column(nullable = false)
    @Builder.Default
    private Instant verifiedAt = Instant.now();

    private String ipAddress;
}

