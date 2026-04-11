package dev.prateek.banque.transaction.controller;

import dev.prateek.banque.transaction.dto.*;
import dev.prateek.banque.transaction.service.TransactionService;
import dev.prateek.banque.user.dto.MessageResponse;
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

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/transactions")
@PreAuthorize("isAuthenticated()")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    /**
     * Get all transactions with filters
     */
    @GetMapping
    public ResponseEntity<Page<TransactionResponse>> getAllTransactions(
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<TransactionResponse> transactions = transactionService.getTransactions(
                    accountId, type, status, query, startDate, endDate, minAmount, maxAmount, pageable
            );
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get transaction by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TransactionResponse> getTransaction(@PathVariable Long id) {
        try {
            TransactionResponse transaction = transactionService.getTransactionById(id);
            return ResponseEntity.ok(transaction);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Deposit money
     */
    @PostMapping("/deposit")
    public ResponseEntity<TransactionResponse> deposit(
            @Valid @RequestBody DepositRequest request
    ) {
        try {
            TransactionResponse transaction = transactionService.deposit(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Withdraw money
     */
    @PostMapping("/withdraw")
    public ResponseEntity<TransactionResponse> withdraw(
            @Valid @RequestBody WithdrawRequest request
    ) {
        try {
            TransactionResponse transaction = transactionService.withdraw(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Search transactions
     */
    @PostMapping("/search")
    public ResponseEntity<Page<TransactionResponse>> searchTransactions(
            @Valid @RequestBody SearchTransactionRequest request,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<TransactionResponse> transactions = transactionService.searchTransactions(request, pageable);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get transaction receipt
     */
    @GetMapping("/{id}/receipt")
    public ResponseEntity<TransactionReceiptResponse> getReceipt(@PathVariable Long id) {
        try {
            TransactionReceiptResponse receipt = transactionService.getTransactionReceipt(id);
            return ResponseEntity.ok(receipt);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get transaction categories
     */
    @GetMapping("/categories")
    public ResponseEntity<TransactionCategoriesResponse> getCategories() {
        try {
            TransactionCategoriesResponse categories = transactionService.getTransactionCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get transaction statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<TransactionStatisticsResponse> getStatistics(
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            TransactionStatisticsResponse statistics = transactionService.getTransactionStatistics(
                    accountId, startDate, endDate
            );
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Raise dispute
     */
    @PostMapping("/{id}/dispute")
    public ResponseEntity<MessageResponse> raiseDispute(
            @PathVariable Long id,
            @Valid @RequestBody RaiseDisputeRequest request
    ) {
        try {
            transactionService.raiseDispute(id, request);
            return ResponseEntity.ok(new MessageResponse("Dispute raised successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Export transactions
     */
    @PostMapping("/export")
    public ResponseEntity<byte[]> exportTransactions(
            @Valid @RequestBody ExportTransactionsRequest request
    ) {
        try {
            byte[] data = transactionService.exportTransactions(request);
            
            String contentType = request.format().equalsIgnoreCase("pdf") 
                    ? "application/pdf" 
                    : "text/csv";
            
            String filename = "transactions_" + request.startDate() + "_to_" + request.endDate() + 
                    "." + request.format().toLowerCase();
            
            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .body(data);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get recent transactions
     */
    @GetMapping("/recent")
    public ResponseEntity<Page<TransactionResponse>> getRecentTransactions(
            @RequestParam(required = false) Long accountId,
            @RequestParam(defaultValue = "10") int limit,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<TransactionResponse> transactions = transactionService.getRecentTransactions(
                    accountId, pageable
            );
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get pending transactions
     */
    @GetMapping("/pending")
    public ResponseEntity<Page<TransactionResponse>> getPendingTransactions(
            @RequestParam(required = false) Long accountId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<TransactionResponse> transactions = transactionService.getPendingTransactions(
                    accountId, pageable
            );
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Cancel transaction
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<MessageResponse> cancelTransaction(@PathVariable Long id) {
        try {
            transactionService.cancelTransaction(id);
            return ResponseEntity.ok(new MessageResponse("Transaction cancelled successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Transaction service is running");
    }
}
