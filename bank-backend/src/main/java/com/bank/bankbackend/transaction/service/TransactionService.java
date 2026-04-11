package com.bank.bankbackend.transaction.service;

import com.bank.bankbackend.account.entity.Account;
import com.bank.bankbackend.account.entity.BalanceHistory;
import com.bank.bankbackend.account.repository.AccountRepository;
import com.bank.bankbackend.account.repository.BalanceHistoryRepository;
import com.bank.bankbackend.security.userdetails.UserDetailsImpl;
import com.bank.bankbackend.transaction.dto.*;
import com.bank.bankbackend.transaction.entity.Transaction;
import com.bank.bankbackend.transaction.repository.TransactionRepository;
import com.bank.bankbackend.user.entity.Notification;
import com.bank.bankbackend.user.entity.User;
import com.bank.bankbackend.user.entity.UserActivity;
import com.bank.bankbackend.user.repository.NotificationRepository;
import com.bank.bankbackend.user.repository.UserActivityRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final BalanceHistoryRepository balanceHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final UserActivityRepository userActivityRepository;

    // Transaction types
    private static final List<String> TRANSACTION_TYPES = Arrays.asList(
            "DEPOSIT", "WITHDRAWAL", "TRANSFER_IN", "TRANSFER_OUT", 
            "PAYMENT", "REFUND", "FEE", "INTEREST"
    );

    // Transaction statuses
    private static final List<String> TRANSACTION_STATUSES = Arrays.asList(
            "PENDING", "COMPLETED", "FAILED", "CANCELLED", "DISPUTED"
    );

    public TransactionService(
            TransactionRepository transactionRepository,
            AccountRepository accountRepository,
            BalanceHistoryRepository balanceHistoryRepository,
            NotificationRepository notificationRepository,
            UserActivityRepository userActivityRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.balanceHistoryRepository = balanceHistoryRepository;
        this.notificationRepository = notificationRepository;
        this.userActivityRepository = userActivityRepository;
    }

    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User not authenticated");
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getUser();
    }

    /**
     * Get transactions with filters
     */
    public Page<TransactionResponse> getTransactions(
            Long accountId,
            String type,
            String status,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            Pageable pageable
    ) {
        User user = getCurrentUser();

        // Build specification for dynamic filtering
        Specification<Transaction> spec = (root, query, cb) -> cb.conjunction();

        // Filter by user's accounts
        List<Long> userAccountIds = accountRepository.findByUserId(user.getId())
                .stream()
                .map(Account::getId)
                .toList();
        spec = spec.and((root, query, cb) -> root.get("accountId").in(userAccountIds));

        // Apply filters
        if (accountId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("accountId"), accountId));
        }
        if (type != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("transactionType"), type));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (startDate != null) {
            spec = spec.and((root, query, cb) -> 
                cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
        }
        if (endDate != null) {
            spec = spec.and((root, query, cb) -> 
                cb.lessThanOrEqualTo(root.get("createdAt"), endDate.atTime(23, 59, 59)));
        }
        if (minAmount != null) {
            spec = spec.and((root, query, cb) -> 
                cb.greaterThanOrEqualTo(root.get("amount"), minAmount));
        }
        if (maxAmount != null) {
            spec = spec.and((root, query, cb) -> 
                cb.lessThanOrEqualTo(root.get("amount"), maxAmount));
        }

        Page<Transaction> transactions = transactionRepository.findAll(spec, pageable);
        return transactions.map(this::mapToTransactionResponse);
    }

    /**
     * Get transaction by ID
     */
    public TransactionResponse getTransactionById(@NotNull Long transactionId) {
        User user = getCurrentUser();

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        // Verify ownership
        verifyTransactionOwnership(user, transaction);

        return mapToTransactionResponse(transaction);
    }

    /**
     * Deposit money
     */
    @Transactional
    public TransactionResponse deposit(@Valid DepositRequest request) {
        User user = getCurrentUser();

        // Get account with lock
        Account account = accountRepository.findByIdWithLock(request.accountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Verify ownership
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Verify account is active
        if (!account.getStatus().equals("ACTIVE")) {
            throw new IllegalArgumentException("Account is not active");
        }

        // Create transaction
        String reference = generateTransactionReference();
        Transaction transaction = new Transaction(
                account.getId(),
                "DEPOSIT",
                request.amount(),
                account.getCurrency(),
                reference,
                request.description()
        );
        transaction.setStatus("COMPLETED");
        transactionRepository.save(transaction);

        // Update account balance
        BigDecimal oldBalance = account.getBalance();
        BigDecimal newBalance = oldBalance.add(request.amount());
        account.setBalance(newBalance);
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);

        // Create balance history
        createBalanceHistory(account, oldBalance, newBalance, "DEPOSIT", 
                "Deposit: " + request.description());

        // Send notification
        createNotification(
                user.getId(),
                "Deposit Successful",
                String.format("%.2f %s deposited to account %s", 
                        request.amount(), account.getCurrency(), account.getAccountNumber()),
                "SUCCESS"
        );

        // Log activity
        logActivity(user, "DEPOSIT", 
                String.format("Deposited %.2f %s to account %s", 
                        request.amount(), account.getCurrency(), account.getAccountNumber()));

        return mapToTransactionResponse(transaction);
    }

    /**
     * Withdraw money
     */
    @Transactional
    public TransactionResponse withdraw(@Valid WithdrawRequest request) {
        User user = getCurrentUser();

        // Get account with lock
        Account account = accountRepository.findByIdWithLock(request.accountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Verify ownership
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Verify account is active
        if (!account.getStatus().equals("ACTIVE")) {
            throw new IllegalArgumentException("Account is not active");
        }

        // Check sufficient balance
        if (account.getBalance().compareTo(request.amount()) < 0) {
            throw new IllegalArgumentException("Insufficient balance");
        }

        // Create transaction
        String reference = generateTransactionReference();
        Transaction transaction = new Transaction(
                account.getId(),
                "WITHDRAWAL",
                request.amount(),
                account.getCurrency(),
                reference,
                request.description()
        );
        transaction.setStatus("COMPLETED");
        transactionRepository.save(transaction);

        // Update account balance
        BigDecimal oldBalance = account.getBalance();
        BigDecimal newBalance = oldBalance.subtract(request.amount());
        account.setBalance(newBalance);
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);

        // Create balance history
        createBalanceHistory(account, oldBalance, newBalance, "WITHDRAWAL", 
                "Withdrawal: " + request.description());

        // Send notification
        createNotification(
                user.getId(),
                "Withdrawal Successful",
                String.format("%.2f %s withdrawn from account %s", 
                        request.amount(), account.getCurrency(), account.getAccountNumber()),
                "SUCCESS"
        );

        // Log activity
        logActivity(user, "WITHDRAWAL", 
                String.format("Withdrew %.2f %s from account %s", 
                        request.amount(), account.getCurrency(), account.getAccountNumber()));

        return mapToTransactionResponse(transaction);
    }

    /**
     * Search transactions
     */
    public Page<TransactionResponse> searchTransactions(
            @Valid SearchTransactionRequest request,
            Pageable pageable
    ) {
        return getTransactions(
                request.accountId(),
                request.type(),
                request.status(),
                request.startDate(),
                request.endDate(),
                request.minAmount(),
                request.maxAmount(),
                pageable
        );
    }

    /**
     * Get transaction receipt
     */
    public TransactionReceiptResponse getTransactionReceipt(@NotNull Long transactionId) {
        User user = getCurrentUser();

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        // Verify ownership
        verifyTransactionOwnership(user, transaction);

        Account account = accountRepository.findById(transaction.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        return new TransactionReceiptResponse(
                transaction.getId(),
                transaction.getReference(),
                transaction.getTransactionType(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getDescription(),
                transaction.getStatus(),
                account.getAccountNumber(),
                account.getAccountType(),
                transaction.getCreatedAt()
        );
    }

    /**
     * Get transaction categories
     */
    public TransactionCategoriesResponse getTransactionCategories() {
        return new TransactionCategoriesResponse(
                TRANSACTION_TYPES,
                TRANSACTION_STATUSES
        );
    }

    /**
     * Get transaction statistics
     */
    public TransactionStatisticsResponse getTransactionStatistics(
            Long accountId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        User user = getCurrentUser();

        // Set default date range if not provided (last 30 days)
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        List<Transaction> transactions;
        
        if (accountId != null) {
            // Verify account ownership
            Account account = accountRepository.findById(accountId)
                    .orElseThrow(() -> new IllegalArgumentException("Account not found"));
            if (!account.getUserId().equals(user.getId())) {
                throw new IllegalArgumentException("Access denied");
            }
            
            transactions = transactionRepository.findByAccountIdAndCreatedAtBetween(
                    accountId, start, end
            );
        } else {
            // Get all user accounts
            List<Long> userAccountIds = accountRepository.findByUserId(user.getId())
                    .stream()
                    .map(Account::getId)
                    .toList();
            
            transactions = transactionRepository.findByAccountIdInAndCreatedAtBetween(
                    userAccountIds, start, end
            );
        }

        int totalTransactions = transactions.size();
        
        BigDecimal totalDeposits = transactions.stream()
                .filter(t -> t.getTransactionType().equals("DEPOSIT") || t.getTransactionType().equals("TRANSFER_IN"))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalWithdrawals = transactions.stream()
                .filter(t -> t.getTransactionType().equals("WITHDRAWAL") || t.getTransactionType().equals("TRANSFER_OUT"))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        long depositCount = transactions.stream()
                .filter(t -> t.getTransactionType().equals("DEPOSIT"))
                .count();
        
        long withdrawalCount = transactions.stream()
                .filter(t -> t.getTransactionType().equals("WITHDRAWAL"))
                .count();
        
        long pendingCount = transactions.stream()
                .filter(t -> t.getStatus().equals("PENDING"))
                .count();
        
        long failedCount = transactions.stream()
                .filter(t -> t.getStatus().equals("FAILED"))
                .count();

        return new TransactionStatisticsResponse(
                totalTransactions,
                totalDeposits,
                totalWithdrawals,
                (int) depositCount,
                (int) withdrawalCount,
                (int) pendingCount,
                (int) failedCount
        );
    }

    /**
     * Raise dispute
     */
    @Transactional
    public void raiseDispute(@NotNull Long transactionId, @Valid RaiseDisputeRequest request) {
        User user = getCurrentUser();

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        // Verify ownership
        verifyTransactionOwnership(user, transaction);

        // Check if transaction can be disputed
        if (!transaction.getStatus().equals("COMPLETED")) {
            throw new IllegalArgumentException("Only completed transactions can be disputed");
        }

        if (transaction.getStatus().equals("DISPUTED")) {
            throw new IllegalArgumentException("Transaction is already under dispute");
        }

        // Update transaction status
        transaction.setStatus("DISPUTED");
        transactionRepository.save(transaction);

        // Send notification
        createNotification(
                user.getId(),
                "Dispute Raised",
                "Dispute raised for transaction " + transaction.getReference() + ". Our team will review it shortly.",
                "INFO"
        );

        // Log activity
        logActivity(user, "DISPUTE_RAISED", 
                "Raised dispute for transaction: " + transaction.getReference() + " - Reason: " + request.reason());
    }

    /**
     * Export transactions
     */
    public byte[] exportTransactions(@Valid ExportTransactionsRequest request) {
        User user = getCurrentUser();

        // Get transactions
        List<Long> userAccountIds = accountRepository.findByUserId(user.getId())
                .stream()
                .map(Account::getId)
                .toList();

        LocalDateTime start = request.startDate().atStartOfDay();
        LocalDateTime end = request.endDate().atTime(23, 59, 59);

        List<Transaction> transactions = transactionRepository.findByAccountIdInAndCreatedAtBetweenOrderByCreatedAtDesc(
                userAccountIds, start, end
        );

        // Generate file
        if (request.format().equalsIgnoreCase("pdf")) {
            return generatePdfExport(transactions);
        } else {
            return generateCsvExport(transactions);
        }
    }

    /**
     * Get recent transactions
     */
    public Page<TransactionResponse> getRecentTransactions(Long accountId, Pageable pageable) {
        User user = getCurrentUser();

        Page<Transaction> transactions;

        if (accountId != null) {
            // Verify account ownership
            Account account = accountRepository.findById(accountId)
                    .orElseThrow(() -> new IllegalArgumentException("Account not found"));
            if (!account.getUserId().equals(user.getId())) {
                throw new IllegalArgumentException("Access denied");
            }
            
            transactions = transactionRepository.findByAccountIdOrderByCreatedAtDesc(
                    accountId, pageable
            );
        } else {
            // Get all user accounts
            List<Long> userAccountIds = accountRepository.findByUserId(user.getId())
                    .stream()
                    .map(Account::getId)
                    .toList();
            
            transactions = transactionRepository.findByAccountIdInOrderByCreatedAtDesc(
                    userAccountIds, pageable
            );
        }

        return transactions.map(this::mapToTransactionResponse);
    }

    /**
     * Get pending transactions
     */
    public Page<TransactionResponse> getPendingTransactions(Long accountId, Pageable pageable) {
        User user = getCurrentUser();

        Page<Transaction> transactions;

        if (accountId != null) {
            // Verify account ownership
            Account account = accountRepository.findById(accountId)
                    .orElseThrow(() -> new IllegalArgumentException("Account not found"));
            if (!account.getUserId().equals(user.getId())) {
                throw new IllegalArgumentException("Access denied");
            }
            
            transactions = transactionRepository.findByAccountIdAndStatusOrderByCreatedAtDesc(
                    accountId, "PENDING", pageable
            );
        } else {
            // Get all user accounts
            List<Long> userAccountIds = accountRepository.findByUserId(user.getId())
                    .stream()
                    .map(Account::getId)
                    .toList();
            
            transactions = transactionRepository.findByAccountIdInAndStatusOrderByCreatedAtDesc(
                    userAccountIds, "PENDING", pageable
            );
        }

        return transactions.map(this::mapToTransactionResponse);
    }

    /**
     * Cancel transaction
     */
    @Transactional
    public void cancelTransaction(@NotNull Long transactionId) {
        User user = getCurrentUser();

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        // Verify ownership
        verifyTransactionOwnership(user, transaction);

        // Check if transaction can be cancelled
        if (!transaction.getStatus().equals("PENDING")) {
            throw new IllegalArgumentException("Only pending transactions can be cancelled");
        }

        // Update transaction status
        transaction.setStatus("CANCELLED");
        transactionRepository.save(transaction);

        // Send notification
        createNotification(
                user.getId(),
                "Transaction Cancelled",
                "Transaction " + transaction.getReference() + " has been cancelled.",
                "INFO"
        );

        // Log activity
        logActivity(user, "TRANSACTION_CANCELLED", 
                "Cancelled transaction: " + transaction.getReference());
    }

    // ==================== Helper Methods ====================

    /**
     * Generate unique transaction reference
     */
    private String generateTransactionReference() {
        return "TXN" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    /**
     * Verify transaction ownership
     */
    private void verifyTransactionOwnership(User user, Transaction transaction) {
        Account account = accountRepository.findById(transaction.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }
    }

    /**
     * Create balance history
     */
    private void createBalanceHistory(
            Account account,
            BigDecimal oldBalance,
            BigDecimal newBalance,
            String transactionType,
            String description
    ) {
        BalanceHistory history = new BalanceHistory(
                account.getId(),
                oldBalance,
                newBalance,
                transactionType,
                description
        );
        balanceHistoryRepository.save(history);
    }

    /**
     * Create notification
     */
    private void createNotification(Long userId, String title, String message, String type) {
        Notification notification = new Notification(userId, title, message, type);
        notificationRepository.save(notification);
    }

    /**
     * Log user activity
     */
    private void logActivity(User user, String action, String description) {
        try {
            String ipAddress = getClientIpAddress();
            String userAgent = getUserAgent();

            UserActivity activity = new UserActivity(
                    user.getId(),
                    action,
                    description,
                    ipAddress,
                    userAgent
            );

            userActivityRepository.save(activity);
        } catch (Exception e) {
            System.err.println("Failed to log activity: " + e.getMessage());
        }
    }

    /**
     * Get client IP address
     */
    private String getClientIpAddress() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();

                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                    return xForwardedFor.split(",")[0].trim();
                }

                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }

    /**
     * Get user agent
     */
    private String getUserAgent() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                return request.getHeader("User-Agent");
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }

    /**
     * Generate PDF export
     */
    private byte[] generatePdfExport(List<Transaction> transactions) {
        // TODO: Implement proper PDF generation
        StringBuilder content = new StringBuilder();
        content.append("TRANSACTION EXPORT\n\n");
        content.append(String.format("Total Transactions: %d\n\n", transactions.size()));
        content.append("Reference,Type,Amount,Currency,Status,Date\n");
        
        transactions.forEach(t -> {
            content.append(String.format("%s,%s,%.2f,%s,%s,%s\n",
                    t.getReference(),
                    t.getTransactionType(),
                    t.getAmount(),
                    t.getCurrency(),
                    t.getStatus(),
                    t.getCreatedAt()
            ));
        });
        
        return content.toString().getBytes();
    }

    /**
     * Generate CSV export
     */
    private byte[] generateCsvExport(List<Transaction> transactions) {
        StringBuilder csv = new StringBuilder();
        csv.append("Reference,Type,Amount,Currency,Status,Description,Date\n");
        
        transactions.forEach(t -> {
            csv.append(String.format("%s,%s,%.2f,%s,%s,%s,%s\n",
                    t.getReference(),
                    t.getTransactionType(),
                    t.getAmount(),
                    t.getCurrency(),
                    t.getStatus(),
                    t.getDescription() != null ? t.getDescription().replace(",", ";") : "",
                    t.getCreatedAt()
            ));
        });
        
        return csv.toString().getBytes();
    }

    /**
     * Map Transaction to TransactionResponse
     */
    private TransactionResponse mapToTransactionResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getAccountId(),
                transaction.getTransactionType(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getReference(),
                transaction.getDescription(),
                transaction.getStatus(),
                transaction.getCreatedAt()
        );
    }
}