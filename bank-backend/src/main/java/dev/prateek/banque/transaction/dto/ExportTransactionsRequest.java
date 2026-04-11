package dev.prateek.banque.transaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record ExportTransactionsRequest(
        @NotNull(message = "Start date is required")
        LocalDate startDate,

        @NotNull(message = "End date is required")
        LocalDate endDate,

        @NotBlank(message = "Format is required")
        @Pattern(regexp = "pdf|csv|PDF|CSV", message = "Format must be either PDF or CSV")
        String format,

        Long accountId
) {}
