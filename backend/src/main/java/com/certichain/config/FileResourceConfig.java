package com.certichain.config;

import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class FileResourceConfig implements WebMvcConfigurer {

    @Value("${certichain.storage.location}")
    private String storageLocation;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String storagePath = Paths.get(storageLocation)
                .toAbsolutePath()
                .normalize()
                .toString()
                .replace("\\", "/");

        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:/" + storagePath + "/");
    }
}
