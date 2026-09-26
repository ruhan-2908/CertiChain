// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CertificateRegistry {
    struct Certificate {
        bytes32 certificateHash;
        address issuer;
        uint256 issueTimestamp;
        bool revoked;
        bool exists;
    }

    mapping(bytes32 => Certificate) private certificates;

    mapping(address => bool) public authorizedIssuers;

    address public owner;

    error Unauthorized();
    error CertificateAlreadyExists();
    error CertificateNotFound();
    error CertificateAlreadyRevoked();
    error InvalidCertificateHash();
    error InvalidCertificateId();
    error InvalidIssuer();

    event CertificateRegistered(
        bytes32 indexed certificateId,
        bytes32 certificateHash,
        address indexed issuer,
        uint256 issueTimestamp
    );

    event CertificateRevoked(
        bytes32 indexed certificateId,
        address indexed issuer,
        uint256 revokeTimestamp
    );

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert Unauthorized();
        }
        _;
    }

    modifier onlyIssuer() {
        if (!authorizedIssuers[msg.sender]) {
            revert Unauthorized();
        }
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    function addIssuer(address issuer) external onlyOwner {
        if (issuer == address(0)) {
            revert InvalidIssuer();
        }

        authorizedIssuers[issuer] = true;
    }

    function removeIssuer(address issuer) external onlyOwner {
        if (issuer == address(0)) {
            revert InvalidIssuer();
        }

        authorizedIssuers[issuer] = false;
    }

    function registerCertificate(
        bytes32 certificateId,
        bytes32 certificateHash
    ) external onlyIssuer {
        if (certificateId == bytes32(0)) {
            revert InvalidCertificateId();
        }

        if (certificateHash == bytes32(0)) {
            revert InvalidCertificateHash();
        }

        if (certificates[certificateId].exists) {
            revert CertificateAlreadyExists();
        }

        certificates[certificateId] = Certificate({
            certificateHash: certificateHash,
            issuer: msg.sender,
            issueTimestamp: block.timestamp,
            revoked: false,
            exists: true
        });

        emit CertificateRegistered(
            certificateId,
            certificateHash,
            msg.sender,
            block.timestamp
        );
    }

    function verifyCertificate(
        bytes32 certificateId
    )
        external
        view
        returns (
            bool exists,
            bytes32 certificateHash,
            address issuer,
            uint256 issueTimestamp,
            bool revoked
        )
    {
        Certificate memory certificate = certificates[certificateId];

        return (
            certificate.exists,
            certificate.certificateHash,
            certificate.issuer,
            certificate.issueTimestamp,
            certificate.revoked
        );
    }

    function revokeCertificate(
        bytes32 certificateId
    ) external onlyIssuer {
        Certificate storage certificate = certificates[certificateId];

        if (!certificate.exists) {
            revert CertificateNotFound();
        }

        if (certificate.revoked) {
            revert CertificateAlreadyRevoked();
        }

        certificate.revoked = true;

        emit CertificateRevoked(
            certificateId,
            msg.sender,
            block.timestamp
        );
    }
}