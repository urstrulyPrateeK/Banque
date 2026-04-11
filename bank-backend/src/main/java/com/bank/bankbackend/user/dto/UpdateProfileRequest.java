package com.bank.bankbackend.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record UpdateProfileRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        String phoneNumber,
        LocalDate dateOfBirth,
        String address,
        String city,
        String state,
        String country,
        String postalCode
) {}
