package dev.prateek.banque.account.controller;

import dev.prateek.banque.account.dto.*;
import dev.prateek.banque.account.service.AccountService;
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

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/accounts")
@PreAuthorize("isAuthenticated()")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    /**
     * Get all user accounts with filters
     */
    @GetMapping
    public ResponseEntity<Page<AccountResponse>> getAllAccounts(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<AccountResponse> accounts = accountService.getUserAccounts(type, status, pageable);
            return ResponseEntity.ok(accounts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get account by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<AccountResponse> getAccount(@PathVariable Long id) {
        try {
            AccountResponse account = accountService.getAccountById(id);
            return ResponseEntity.ok(account);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Create new account
     */
    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(
            @Valid @RequestBody CreateAccountRequest request
    ) {
        try {
            AccountResponse account = accountService.createAccount(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(account);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update account details
     */
    @PatchMapping("/{id}")
    public ResponseEntity<AccountResponse> updateAccount(
            @PathVariable Long id,
            @RequestBody UpdateAccountRequest request
    ) {
        try {
            AccountResponse account = accountService.updateAccount(id, request);
            return ResponseEntity.ok(account);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Close account (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> closeAccount(@PathVariable Long id) {
        try {
            accountService.closeAccount(id);
            return ResponseEntity.ok(new MessageResponse("Account closed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Get account balance
     */
    @GetMapping("/{id}/balance")
    public ResponseEntity<BalanceResponse> getBalance(@PathVariable Long id) {
        try {
            BalanceResponse balance = accountService.getAccountBalance(id);
            return ResponseEntity.ok(balance);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get balance history
     */
    @GetMapping("/{id}/balance/history")
    public ResponseEntity<Page<BalanceHistoryResponse>> getBalanceHistory(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 30, sort = "recordedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        try {
            Page<BalanceHistoryResponse> history = accountService.getBalanceHistory(id, startDate, endDate, pageable);
            return ResponseEntity.ok(history);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get account statement
     */
    @GetMapping("/{id}/statement")
    public ResponseEntity<StatementResponse> getStatement(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            StatementResponse statement = accountService.getAccountStatement(id, startDate, endDate);
            return ResponseEntity.ok(statement);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Download account statement (PDF/CSV)
     */
    @PostMapping("/{id}/statement/download")
    public ResponseEntity<byte[]> downloadStatement(
            @PathVariable Long id,
            @Valid @RequestBody DownloadStatementRequest request
    ) {
        try {
            byte[] data = accountService.downloadStatement(id, request);

            String contentType = request.format().equalsIgnoreCase("pdf")
                    ? "application/pdf"
                    : "text/csv";

            String filename = "statement_" + id + "_" +
                    request.startDate() + "_to_" + request.endDate() +
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
     * Get account summary
     */
    @GetMapping("/{id}/summary")
    public ResponseEntity<AccountSummaryResponse> getAccountSummary(@PathVariable Long id) {
        try {
            AccountSummaryResponse summary = accountService.getAccountSummary(id);
            return ResponseEntity.ok(summary);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Set account as primary
     */
    @PutMapping("/{id}/primary")
    public ResponseEntity<MessageResponse> setPrimaryAccount(@PathVariable Long id) {
        try {
            accountService.setPrimaryAccount(id);
            return ResponseEntity.ok(new MessageResponse("Account set as primary successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Get all accounts summary
     */
    @GetMapping("/summary")
    public ResponseEntity<AllAccountsSummaryResponse> getAllAccountsSummary() {
        try {
            AllAccountsSummaryResponse summary = accountService.getAllAccountsSummary();
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Freeze account
     */
    @PutMapping("/{id}/freeze")
    public ResponseEntity<MessageResponse> freezeAccount(
            @PathVariable Long id,
            @RequestParam String reason
    ) {
        try {
            accountService.freezeAccount(id, reason);
            return ResponseEntity.ok(new MessageResponse("Account frozen successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Unfreeze account
     */
    @PutMapping("/{id}/unfreeze")
    public ResponseEntity<MessageResponse> unfreezeAccount(@PathVariable Long id) {
        try {
            accountService.unfreezeAccount(id);
            return ResponseEntity.ok(new MessageResponse("Account unfrozen successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Get account types
     */
    @GetMapping("/types")
    @PreAuthorize("permitAll()")
    public ResponseEntity<AccountTypesResponse> getAccountTypes() {
        try {
            AccountTypesResponse types = accountService.getAccountTypes();
            return ResponseEntity.ok(types);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get account statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<AccountStatisticsResponse> getAccountStatistics() {
        try {
            AccountStatisticsResponse statistics = accountService.getAccountStatistics();
            return ResponseEntity.ok(statistics);
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
        return ResponseEntity.ok("Account service is running");
    }
}
