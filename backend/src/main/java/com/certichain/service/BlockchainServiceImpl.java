package com.certichain.service;

import com.certichain.exception.ApiException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Bool;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.generated.Bytes32;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.Hash;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.RemoteFunctionCall;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.protocol.exceptions.TransactionException;
import org.web3j.tx.Contract;
import org.web3j.tx.exceptions.ContractCallException;
import org.web3j.tx.gas.ContractGasProvider;
import org.web3j.utils.Numeric;

import java.io.IOException;
import java.math.BigInteger;
import java.net.ConnectException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlockchainServiceImpl implements BlockchainService {

    private final Web3j web3j;
    private final Credentials credentials;
    private final ContractGasProvider gasProvider;

    @Value("${certichain.blockchain.contract-address:0x5FbDB2315678afecb367f032d93F642f64180aa3}")
    private String contractAddress;

    @Value("${certichain.blockchain.rpc-url:http://127.0.0.1:8545}")
    private String rpcUrl;

    private CertificateRegistryContract contract;

    @PostConstruct
    public void init() {
        validateConfiguration();
        this.contract = new CertificateRegistryContract(
                contractAddress.trim(),
                web3j,
                credentials,
                gasProvider
        );
    }

    private void validateConfiguration() {
        if (contractAddress == null || contractAddress.isBlank()) {
            throw new IllegalStateException("certichain.blockchain.contract-address is not configured");
        }
        String cleanAddress = Numeric.cleanHexPrefix(contractAddress.trim());
        if (cleanAddress.length() != 40 || cleanAddress.equals("0000000000000000000000000000000000000000")) {
            throw new IllegalStateException("certichain.blockchain.contract-address must be a valid 40-character hex Ethereum address");
        }
    }

    /**
     * Deterministic conversion from certificateId String to bytes32 (Keccak-256 hash).
     * Used identically for register, verify, and revoke operations.
     */
    public static byte[] certificateIdToBytes32(String certificateId) {
        if (certificateId == null || certificateId.trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Certificate ID cannot be null or empty");
        }
        return Hash.sha3(certificateId.trim().getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Converts a 64-character SHA-256 hex string to bytes32 (32 raw bytes).
     */
    public static byte[] documentHashToBytes32(String documentHash) {
        if (documentHash == null || documentHash.trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Document hash cannot be null or empty");
        }
        String cleanHex = Numeric.cleanHexPrefix(documentHash.trim());
        if (cleanHex.length() != 64) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Document hash must be a 64-character hexadecimal SHA-256 string, got " + cleanHex.length() + " characters"
            );
        }
        return Numeric.hexStringToByteArray(cleanHex);
    }

    @Override
    public String registerCertificateHash(String certificateId, String hash) {
        byte[] certIdBytes = certificateIdToBytes32(certificateId);
        byte[] hashBytes = documentHashToBytes32(hash);

        return executeBlockchainAction(() -> {
            TransactionReceipt receipt = contract.registerCertificate(certIdBytes, hashBytes).send();
            if (!receipt.isStatusOK()) {
                handleFailedReceipt(receipt, "registerCertificate");
            }
            log.info("Certificate registered on blockchain: id={}, txHash={}", certificateId, receipt.getTransactionHash());
            return receipt.getTransactionHash();
        }, "registerCertificate (" + certificateId + ")");
    }

    @Override
    public CertificateRecord getCertificateRecord(String certificateId) {
        byte[] certIdBytes = certificateIdToBytes32(certificateId);

        return executeBlockchainAction(() -> {
            List<Type> values = contract.verifyCertificate(certIdBytes).send();
            if (values == null || values.size() < 5) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid response from blockchain for verifyCertificate");
            }

            boolean exists = ((Bool) values.get(0)).getValue();
            if (!exists) {
                return new CertificateRecord(null, null, null, false, false);
            }

            byte[] onChainHashBytes = ((Bytes32) values.get(1)).getValue();
            String onChainHash = Numeric.toHexStringNoPrefix(onChainHashBytes);

            String issuer = ((Address) values.get(2)).getValue();
            BigInteger timestampSec = ((Uint256) values.get(3)).getValue();
            boolean revoked = ((Bool) values.get(4)).getValue();

            Instant issueTimestamp = timestampSec != null && timestampSec.longValue() > 0
                    ? Instant.ofEpochSecond(timestampSec.longValue())
                    : null;

            return new CertificateRecord(
                    onChainHash,
                    issuer,
                    issueTimestamp,
                    revoked,
                    true
            );
        }, "verifyCertificate (" + certificateId + ")");
    }

    @Override
    public void revokeCertificate(String certificateId) {
        byte[] certIdBytes = certificateIdToBytes32(certificateId);

        executeBlockchainAction(() -> {
            TransactionReceipt receipt = contract.revokeCertificate(certIdBytes).send();
            if (!receipt.isStatusOK()) {
                handleFailedReceipt(receipt, "revokeCertificate");
            }
            log.info("Certificate revoked on blockchain: id={}, txHash={}", certificateId, receipt.getTransactionHash());
            return null;
        }, "revokeCertificate (" + certificateId + ")");
    }

    private void handleFailedReceipt(TransactionReceipt receipt, String operation) {
        String revertReason = receipt.getRevertReason();
        String txHash = receipt.getTransactionHash();
        String message = (revertReason != null && !revertReason.isBlank())
                ? revertReason
                : "Transaction failed with status " + receipt.getStatus();
        mapRevertToException(message, txHash, operation);
    }

    private <T> T executeBlockchainAction(BlockchainSupplier<T> supplier, String actionDescription) {
        try {
            return supplier.get();
        } catch (TransactionException exception) {
            String message = exception.getMessage();
            String txHash = exception.getTransactionHash().orElse(null);
            if (exception.getTransactionReceipt().isPresent()) {
                TransactionReceipt receipt = exception.getTransactionReceipt().get();
                if (receipt.getRevertReason() != null && !receipt.getRevertReason().isBlank()) {
                    message = receipt.getRevertReason();
                }
            }
            mapRevertToException(message, txHash, actionDescription);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Blockchain transaction failed: " + message);
        } catch (ContractCallException exception) {
            mapRevertToException(exception.getMessage(), null, actionDescription);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Smart contract call reverted: " + exception.getMessage());
        } catch (ConnectException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Blockchain node connection refused at " + rpcUrl);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Blockchain RPC network error: " + exception.getMessage());
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected blockchain error: " + exception.getMessage());
        }
    }

    private void mapRevertToException(String reason, String txHash, String operation) {
        String detail = reason != null ? reason : "Unknown revert";
        String suffix = txHash != null ? " (tx: " + txHash + ")" : "";

        if (detail.contains("Unauthorized") || detail.contains("82b42900")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Unauthorized: sender is not an authorized issuer on-chain" + suffix);
        }
        if (detail.contains("CertificateAlreadyExists") || detail.contains("ee6a4b16")) {
            throw new ApiException(HttpStatus.CONFLICT, "Certificate already exists on blockchain" + suffix);
        }
        if (detail.contains("CertificateNotFound") || detail.contains("974b620b")) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Certificate not found on blockchain" + suffix);
        }
        if (detail.contains("CertificateAlreadyRevoked") || detail.contains("995e8697")) {
            throw new ApiException(HttpStatus.CONFLICT, "Certificate is already revoked on blockchain" + suffix);
        }
        if (detail.contains("InvalidCertificateHash") || detail.contains("247481ba")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid certificate hash supplied to contract" + suffix);
        }
        if (detail.contains("InvalidCertificateId") || detail.contains("a3346c7d")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid certificate ID supplied to contract" + suffix);
        }
        if (detail.contains("InvalidIssuer") || detail.contains("e12a45fb")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid issuer address supplied to contract" + suffix);
        }

        throw new ApiException(HttpStatus.BAD_REQUEST, "Blockchain transaction reverted during " + operation + ": " + detail + suffix);
    }

    @FunctionalInterface
    private interface BlockchainSupplier<T> {
        T get() throws Exception;
    }

    /**
     * Web3j Contract wrapper for CertificateRegistry.sol.
     */
    private static class CertificateRegistryContract extends Contract {

        protected CertificateRegistryContract(
                String contractAddress,
                Web3j web3j,
                Credentials credentials,
                ContractGasProvider gasProvider) {
            super("", contractAddress, web3j, credentials, gasProvider);
        }

        public RemoteFunctionCall<TransactionReceipt> registerCertificate(byte[] certificateId, byte[] certificateHash) {
            Function function = new Function(
                    "registerCertificate",
                    Arrays.asList(new Bytes32(certificateId), new Bytes32(certificateHash)),
                    Collections.emptyList()
            );
            return executeRemoteCallTransaction(function);
        }

        public RemoteFunctionCall<List<Type>> verifyCertificate(byte[] certificateId) {
            Function function = new Function(
                    "verifyCertificate",
                    Collections.singletonList(new Bytes32(certificateId)),
                    Arrays.asList(
                            new TypeReference<Bool>() {},
                            new TypeReference<Bytes32>() {},
                            new TypeReference<Address>() {},
                            new TypeReference<Uint256>() {},
                            new TypeReference<Bool>() {}
                    )
            );
            return executeRemoteCallMultipleValueReturn(function);
        }

        public RemoteFunctionCall<TransactionReceipt> revokeCertificate(byte[] certificateId) {
            Function function = new Function(
                    "revokeCertificate",
                    Collections.singletonList(new Bytes32(certificateId)),
                    Collections.emptyList()
            );
            return executeRemoteCallTransaction(function);
        }
    }
}
