package com.bank.bankbackend.card.controller;

import com.bank.bankbackend.card.dto.*;
import com.bank.bankbackend.card.service.CardService;
import com.bank.bankbackend.user.dto.MessageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/cards")
@PreAuthorize("isAuthenticated()")
public class CardController {

    private final CardService cardService;

    public CardController(CardService cardService) {
        this.cardService = cardService;
    }

    /**
     * Request new card
     */
    @PostMapping("/request")
    public ResponseEntity<CardResponse> requestCard(
            @Valid @RequestBody CardRequestRequest request
    ) {
        try {
            CardResponse card = cardService.requestCard(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(card);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get all cards
     */
    @GetMapping
    public ResponseEntity<Page<CardResponse>> getAllCards(
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<CardResponse> cards = cardService.getCards(accountId, type, status, pageable);
            return ResponseEntity.ok(cards);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get card by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CardResponse> getCard(@PathVariable Long id) {
        try {
            CardResponse card = cardService.getCardById(id);
            return ResponseEntity.ok(card);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Activate card
     */
    @PostMapping("/{id}/activate")
    public ResponseEntity<MessageResponse> activateCard(
            @PathVariable Long id,
            @Valid @RequestBody ActivateCardRequest request
    ) {
        try {
            cardService.activateCard(id, request);
            return ResponseEntity.ok(new MessageResponse("Card activated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Block card
     */
    @PostMapping("/{id}/block")
    public ResponseEntity<MessageResponse> blockCard(
            @PathVariable Long id,
            @RequestParam String reason
    ) {
        try {
            cardService.blockCard(id, reason);
            return ResponseEntity.ok(new MessageResponse("Card blocked successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Unblock card
     */
    @PostMapping("/{id}/unblock")
    public ResponseEntity<MessageResponse> unblockCard(@PathVariable Long id) {
        try {
            cardService.unblockCard(id);
            return ResponseEntity.ok(new MessageResponse("Card unblocked successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Report card lost/stolen
     */
    @PostMapping("/{id}/report-lost")
    public ResponseEntity<MessageResponse> reportLost(@PathVariable Long id) {
        try {
            cardService.reportLost(id);
            return ResponseEntity.ok(new MessageResponse("Card reported as lost and blocked"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Request card replacement
     */
    @PostMapping("/{id}/replace")
    public ResponseEntity<CardResponse> replaceCard(
            @PathVariable Long id,
            @RequestParam String reason
    ) {
        try {
            CardResponse card = cardService.replaceCard(id, reason);
            return ResponseEntity.status(HttpStatus.CREATED).body(card);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Change card PIN
     */
    @PostMapping("/{id}/change-pin")
    public ResponseEntity<MessageResponse> changePin(
            @PathVariable Long id,
            @Valid @RequestBody ChangePinRequest request
    ) {
        try {
            cardService.changePin(id, request);
            return ResponseEntity.ok(new MessageResponse("PIN changed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Set card limits
     */
    @PutMapping("/{id}/limits")
    public ResponseEntity<CardLimitsResponse> setCardLimits(
            @PathVariable Long id,
            @Valid @RequestBody SetCardLimitsRequest request
    ) {
        try {
            CardLimitsResponse limits = cardService.setCardLimits(id, request);
            return ResponseEntity.ok(limits);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get card limits
     */
    @GetMapping("/{id}/limits")
    public ResponseEntity<CardLimitsResponse> getCardLimits(@PathVariable Long id) {
        try {
            CardLimitsResponse limits = cardService.getCardLimits(id);
            return ResponseEntity.ok(limits);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get card transactions
     */
    @GetMapping("/{id}/transactions")
    public ResponseEntity<Page<CardTransactionResponse>> getCardTransactions(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<CardTransactionResponse> transactions = cardService.getCardTransactions(
                    id, startDate, endDate, pageable
            );
            return ResponseEntity.ok(transactions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get card statement
     */
    @GetMapping("/{id}/statement")
    public ResponseEntity<CardStatementResponse> getCardStatement(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            CardStatementResponse statement = cardService.getCardStatement(id, startDate, endDate);
            return ResponseEntity.ok(statement);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get card details (masked)
     */
    @GetMapping("/{id}/details")
    public ResponseEntity<CardDetailsResponse> getCardDetails(@PathVariable Long id) {
        try {
            CardDetailsResponse details = cardService.getCardDetails(id);
            return ResponseEntity.ok(details);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Toggle contactless
     */
    @PutMapping("/{id}/contactless")
    public ResponseEntity<MessageResponse> toggleContactless(
            @PathVariable Long id,
            @RequestParam boolean enabled
    ) {
        try {
            cardService.toggleContactless(id, enabled);
            return ResponseEntity.ok(new MessageResponse(
                    "Contactless " + (enabled ? "enabled" : "disabled") + " successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Toggle online transactions
     */
    @PutMapping("/{id}/online-transactions")
    public ResponseEntity<MessageResponse> toggleOnlineTransactions(
            @PathVariable Long id,
            @RequestParam boolean enabled
    ) {
        try {
            cardService.toggleOnlineTransactions(id, enabled);
            return ResponseEntity.ok(new MessageResponse(
                    "Online transactions " + (enabled ? "enabled" : "disabled") + " successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Toggle international transactions
     */
    @PutMapping("/{id}/international")
    public ResponseEntity<MessageResponse> toggleInternational(
            @PathVariable Long id,
            @RequestParam boolean enabled
    ) {
        try {
            cardService.toggleInternational(id, enabled);
            return ResponseEntity.ok(new MessageResponse(
                    "International transactions " + (enabled ? "enabled" : "disabled") + " successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Cancel card
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> cancelCard(@PathVariable Long id) {
        try {
            cardService.cancelCard(id);
            return ResponseEntity.ok(new MessageResponse("Card cancelled successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Get card statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<CardStatisticsResponse> getStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            CardStatisticsResponse statistics = cardService.getCardStatistics(startDate, endDate);
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get card types
     */
    @GetMapping("/types")
    public ResponseEntity<CardTypesResponse> getCardTypes() {
        try {
            CardTypesResponse types = cardService.getCardTypes();
            return ResponseEntity.ok(types);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Card service is running");
    }
}