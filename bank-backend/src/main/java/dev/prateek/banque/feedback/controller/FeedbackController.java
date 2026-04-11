// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.feedback.controller;

import dev.prateek.banque.feedback.dto.FeedbackRequest;
import dev.prateek.banque.feedback.service.FeedbackService;
import dev.prateek.banque.user.dto.MessageResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> saveFeedback(@Valid @RequestBody FeedbackRequest request) {
        return ResponseEntity.ok(feedbackService.saveFeedback(request));
    }
}
