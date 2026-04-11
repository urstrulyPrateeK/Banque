package dev.prateek.banque.user.dto;

import java.time.LocalDate;

public record PartialUpdateRequest(
        String firstName,
        String lastName,
        String phoneNumber,
        LocalDate dateOfBirth,
        String address,
        String city,
        String state,
        String country,
        String postalCode
) {}

