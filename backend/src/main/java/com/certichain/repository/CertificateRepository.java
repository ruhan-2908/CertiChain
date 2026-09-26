package com.certichain.repository;

import com.certichain.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    Optional<Certificate> findByCertificateId(String certificateId);

    boolean existsByCertificateId(String certificateId);

    List<Certificate> findByStudentId(Long studentId);
}
