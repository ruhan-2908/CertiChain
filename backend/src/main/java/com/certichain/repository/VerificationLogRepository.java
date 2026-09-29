
package com.certichain.repository;

import com.certichain.entity.VerificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationLogRepository extends JpaRepository<VerificationLog, Long> {
}

