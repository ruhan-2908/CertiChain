
package com.certichain.service;

import java.time.Instant;

public interface BlockchainService {

    String registerCertificateHash(String certificateId, String hash);

    CertificateRecord getCertificateRecord(String certificateId);

    void revokeCertificate(String certificateId);
}

record CertificateRecord(
        String hash,
        String issuerAddress,
        Instant issueTimestamp,
        boolean revoked,
        boolean found
) {}
