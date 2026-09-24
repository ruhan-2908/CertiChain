package com.certichain.dto;

import com.certichain.entity.Role;

public record AuthResponse(
        String token,
        String tokenType,
        Long userId,
        String fullName,
        String email,
        Role role
) {
    public static AuthResponse of(String token, Long userId, String fullName, String email, Role role) {
        return new AuthResponse(token, "Bearer", userId, fullName, email, role);
    }
}
