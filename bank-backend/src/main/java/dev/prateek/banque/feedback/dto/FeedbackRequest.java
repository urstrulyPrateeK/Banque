// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.feedback.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FeedbackRequest(
        @NotNull Long transactionId,
        boolean positive,
        @Size(max = 250) String comment
) {
}
