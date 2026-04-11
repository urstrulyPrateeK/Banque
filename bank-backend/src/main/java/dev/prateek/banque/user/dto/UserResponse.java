package dev.prateek.banque.user.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String email,
        String firstName,
        String lastName,
        String phoneNumber,
        LocalDate dateOfBirth,
        String address,
        String city,
        String state,
        String country,
        String postalCode,
        String role,
        boolean active,
        boolean emailVerified,
        boolean mfaEnabled,
        String avatarUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

