package com.certichain.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.gas.DefaultGasProvider;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;

public class BlockchainServiceImplTest {

    private BlockchainServiceImpl blockchainService;

    @BeforeEach
    void setUp() throws Exception {
        Web3j web3j = Web3j.build(new HttpService("http://127.0.0.1:8545"));
        Credentials credentials = Credentials.create("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
        DefaultGasProvider gasProvider = new DefaultGasProvider();

        blockchainService = new BlockchainServiceImpl(web3j, credentials, gasProvider);

        setField(blockchainService, "contractAddress", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
        setField(blockchainService, "rpcUrl", "http://127.0.0.1:8545");

        blockchainService.init();
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    @Test
    @DisplayName("Test blockchain registration, verification, and revocation flow")
    void testRegisterVerifyAndRevokeFlow() {
        String certificateId = "CERT-TEST-" + System.currentTimeMillis();
        // 64-character hex SHA-256 hash (empty string SHA-256)
        String validSha256Hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

        // 1. Initial check: before registration, should not be found
        CertificateRecord initialRecord = blockchainService.getCertificateRecord(certificateId);
        assertNotNull(initialRecord, "Initial record should not be null");
        assertFalse(initialRecord.found(), "Initial record found should be false");
        assertFalse(initialRecord.revoked(), "Initial record revoked should be false");
        System.out.println("Step 1 PASSED: Initial check for " + certificateId + " -> found=false, revoked=false");

        // 2. Register certificate
        String txHash = blockchainService.registerCertificateHash(certificateId, validSha256Hash);
        assertNotNull(txHash, "Registration must return a transaction hash");
        assertTrue(txHash.startsWith("0x"), "Transaction hash must start with 0x");
        assertEquals(66, txHash.length(), "Transaction hash must be 66 characters long");
        System.out.println("Step 2 PASSED: Registered " + certificateId + " with txHash: " + txHash);

        // 3. Verify record after registration
        CertificateRecord registeredRecord = blockchainService.getCertificateRecord(certificateId);
        assertNotNull(registeredRecord, "Registered record should not be null");
        assertTrue(registeredRecord.found(), "Certificate record found must be true");
        assertEquals(validSha256Hash.toLowerCase(), registeredRecord.hash().toLowerCase(), "Stored hash must match");
        assertFalse(registeredRecord.revoked(), "Revoked status must be false before revocation");
        assertNotNull(registeredRecord.issuerAddress(), "Issuer address must be present");
        assertEquals("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", registeredRecord.issuerAddress().toLowerCase(), "Issuer address must match deployer");
        assertNotNull(registeredRecord.issueTimestamp(), "Issue timestamp must be present");
        System.out.println("Step 3 PASSED: Verified record -> found=true, hash=" + registeredRecord.hash() + ", revoked=false, issuer=" + registeredRecord.issuerAddress());

        // 4. Revoke certificate
        blockchainService.revokeCertificate(certificateId);
        System.out.println("Step 4 PASSED: revokeCertificate called successfully");

        // 5. Verify record after revocation
        CertificateRecord revokedRecord = blockchainService.getCertificateRecord(certificateId);
        assertNotNull(revokedRecord, "Revoked record should not be null");
        assertTrue(revokedRecord.found(), "Certificate record found must remain true");
        assertEquals(validSha256Hash.toLowerCase(), revokedRecord.hash().toLowerCase(), "Stored hash must still match");
        assertTrue(revokedRecord.revoked(), "Revoked status must be true after revocation");
        System.out.println("Step 5 PASSED: Verified revoked record -> found=true, revoked=true, hash=" + revokedRecord.hash());
    }
}
