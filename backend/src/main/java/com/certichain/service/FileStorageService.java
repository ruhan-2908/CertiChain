package com.certichain.service;

import com.certichain.exception.ApiException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    @Value("${certichain.storage.location}")
    private String storageLocation;

    private Path storagePath;

    @PostConstruct
    void initialize() {
        storagePath = Paths.get(storageLocation).toAbsolutePath().normalize();
        try {
            Files.createDirectories(storagePath);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not create certificate storage directory", exception);
        }
    }

    public String store(MultipartFile file, String certificateId) {
        if (file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File is required");
        }
        if (!"application/pdf".equalsIgnoreCase(file.getContentType())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only PDF files are accepted");
        }

        try {
            Files.write(storagePath.resolve(certificateId + ".pdf"), file.getBytes());
            return "/files/" + certificateId + ".pdf";
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Could not store uploaded file");
        }
    }

    public byte[] loadAsBytes(String certificateId) {
        try {
            return Files.readAllBytes(storagePath.resolve(certificateId + ".pdf"));
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Certificate file not found");
        }
    }

    public void delete(String certificateId) {
        try {
            Files.deleteIfExists(storagePath.resolve(certificateId + ".pdf"));
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not delete certificate file");
        }
    }
}
