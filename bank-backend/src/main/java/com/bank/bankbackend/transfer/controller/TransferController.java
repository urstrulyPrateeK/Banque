package com.bank.bankbackend.transfer.controller;

import com.bank.bankbackend.transfer.dto.*;
import com.bank.bankbackend.transfer.service.TransferService;
import com.bank.bankbackend.user.dto.MessageResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
@RequestMapping("/api/v1/transfers")
@PreAuthorize("isAuthenticated()")
public class TransferController {

    private static final Logger logger = LoggerFactory.getLogger(TransferController.class);
    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    /**
     * Initiate internal transfer (between own accounts)
     */
    @PostMapping("/internal")
    public ResponseEntity<TransferResponse> internalTransfer(
            @Valid @RequestBody InternalTransferRequest request
    ) {
        try {
            TransferResponse transfer = transferService.internalTransfer(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(transfer);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid internal transfer request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error processing internal transfer: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Initiate external transfer (to another user's account)
     */
    @PostMapping("/external")
    public ResponseEntity<TransferResponse> externalTransfer(
            @Valid @RequestBody ExternalTransferRequest request
    ) {
        try {
            TransferResponse transfer = transferService.externalTransfer(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(transfer);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid external transfer request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error processing external transfer: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Initiate scheduled transfer
     */
    @PostMapping("/scheduled")
    public ResponseEntity<TransferResponse> scheduledTransfer(
            @Valid @RequestBody ScheduledTransferRequest request
    ) {
        try {
            TransferResponse transfer = transferService.scheduleTransfer(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(transfer);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid scheduled transfer request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error processing scheduled transfer: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Initiate recurring transfer
     */
    @PostMapping("/recurring")
    public ResponseEntity<RecurringTransferResponse> recurringTransfer(
            @Valid @RequestBody RecurringTransferRequest request
    ) {
        try {
            RecurringTransferResponse transfer = transferService.createRecurringTransfer(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(transfer);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid recurring transfer request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error processing recurring transfer: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all transfers with filters
     */
    @GetMapping
    public ResponseEntity<Page<TransferResponse>> getAllTransfers(
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<TransferResponse> transfers = transferService.getTransfers(
                    accountId, type, status, startDate, endDate, pageable
            );
            return ResponseEntity.ok(transfers);
        } catch (Exception e) {
            logger.error("Error fetching transfers: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get transfer by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TransferResponse> getTransfer(@PathVariable Long id) {
        try {
            TransferResponse transfer = transferService.getTransferById(id);
            return ResponseEntity.ok(transfer);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            logger.error("Error fetching transfer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get pending transfers
     */
    @GetMapping("/pending")
    public ResponseEntity<Page<TransferResponse>> getPendingTransfers(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<TransferResponse> transfers = transferService.getPendingTransfers(pageable);
            return ResponseEntity.ok(transfers);
        } catch (Exception e) {
            logger.error("Error fetching pending transfers: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get scheduled transfers
     */
    @GetMapping("/scheduled")
    public ResponseEntity<Page<TransferResponse>> getScheduledTransfers(
            @PageableDefault(size = 20, sort = "scheduledDate", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        try {
            Page<TransferResponse> transfers = transferService.getScheduledTransfers(pageable);
            return ResponseEntity.ok(transfers);
        } catch (Exception e) {
            logger.error("Error fetching scheduled transfers: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get recurring transfers
     */
    @GetMapping("/recurring")
    public ResponseEntity<Page<RecurringTransferResponse>> getRecurringTransfers(
            @RequestParam(required = false) Boolean activeOnly,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<RecurringTransferResponse> transfers = transferService.getRecurringTransfers(
                    activeOnly, pageable
            );
            return ResponseEntity.ok(transfers);
        } catch (Exception e) {
            logger.error("Error fetching recurring transfers: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Cancel transfer
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<MessageResponse> cancelTransfer(@PathVariable Long id) {
        try {
            transferService.cancelTransfer(id);
            return ResponseEntity.ok(new MessageResponse("Transfer cancelled successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error cancelling transfer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Cancel recurring transfer
     */
    @PostMapping("/recurring/{id}/cancel")
    public ResponseEntity<MessageResponse> cancelRecurringTransfer(@PathVariable Long id) {
        try {
            transferService.cancelRecurringTransfer(id);
            return ResponseEntity.ok(new MessageResponse("Recurring transfer cancelled successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error cancelling recurring transfer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get transfer receipt
     */
    @GetMapping("/{id}/receipt")
    public ResponseEntity<TransferReceiptResponse> getReceipt(@PathVariable Long id) {
        try {
            TransferReceiptResponse receipt = transferService.getTransferReceipt(id);
            return ResponseEntity.ok(receipt);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            logger.error("Error fetching receipt for transfer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Verify account number for transfer
     */
    @PostMapping("/verify-account")
    public ResponseEntity<VerifyAccountResponse> verifyAccount(
            @Valid @RequestBody VerifyAccountRequest request
    ) {
        try {
            VerifyAccountResponse response = transferService.verifyAccount(request.accountNumber());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            logger.error("Error verifying account {}: {}", request.accountNumber(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get transfer statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<TransferStatisticsResponse> getStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            TransferStatisticsResponse statistics = transferService.getTransferStatistics(
                    startDate, endDate
            );
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            logger.error("Error fetching transfer statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get transfer limits
     */
    @GetMapping("/limits")
    public ResponseEntity<TransferLimitsResponse> getTransferLimits() {
        try {
            TransferLimitsResponse limits = transferService.getTransferLimits();
            return ResponseEntity.ok(limits);
        } catch (Exception e) {
            logger.error("Error fetching transfer limits: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Transfer service is running");
    }
}