package com.certichain.service;

import com.certichain.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
public class HashingService {

    public String sha256Hex(byte[] data) {
        try {
            return java.util.HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(data));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm is not available", exception);
        }
    }

    public String sha256Hex(MultipartFile file) {
        try {
            return sha256Hex(file.getBytes());
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Could not read uploaded file");
        }
    }
}
