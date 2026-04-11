package com.bank.bankbackend.account.service;

import com.bank.bankbackend.account.dto.*;
import com.bank.bankbackend.account.entity.Account;
import com.bank.bankbackend.account.entity.BalanceHistory;
import com.bank.bankbackend.account.repository.AccountRepository;
import com.bank.bankbackend.account.repository.BalanceHistoryRepository;
import com.bank.bankbackend.security.userdetails.UserDetailsImpl;
import com.bank.bankbackend.user.entity.Notification;
import com.bank.bankbackend.user.entity.User;
import com.bank.bankbackend.user.entity.UserActivity;
import com.bank.bankbackend.user.repository.NotificationRepository;
import com.bank.bankbackend.user.repository.UserActivityRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final BalanceHistoryRepository balanceHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final UserActivityRepository userActivityRepository;

    // Account configuration
    private static final String ACCOUNT_PREFIX = "ACC";
    private static final Random random = new Random();

    // Account types
    private static final List<String> ACCOUNT_TYPES = Arrays.asList(
            "SAVINGS", "CHECKING", "BUSINESS", "STUDENT", "INVESTMENT"
    );

    // Account statuses
    private static final List<String> ACCOUNT_STATUSES = Arrays.asList(
            "ACTIVE", "FROZEN", "CLOSED", "PENDING"
    );

    public AccountService(
            AccountRepository accountRepository,
            BalanceHistoryRepository balanceHistoryRepository,
            NotificationRepository notificationRepository,
            UserActivityRepository userActivityRepository
    ) {
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
     * Get user accounts with filters
     */
    public Page<AccountResponse> getUserAccounts(String type, String status, Pageable pageable) {
        User user = getCurrentUser();

        Page<Account> accounts;

        if (type != null && status != null) {
            accounts = accountRepository.findByUserIdAndAccountTypeAndStatus(
                    user.getId(), type, status, pageable
            );
        } else if (type != null) {
            accounts = accountRepository.findByUserIdAndAccountType(
                    user.getId(), type, pageable
            );
        } else if (status != null) {
            accounts = accountRepository.findByUserIdAndStatus(
                    user.getId(), status, pageable
            );
        } else {
            accounts = accountRepository.findByUserIdOrderByCreatedAtDesc(
                    user.getId(), pageable
            );
        }

        return accounts.map(this::mapToAccountResponse);
    }

    /**
     * Get account by ID
     */
    public AccountResponse getAccountById(@NotNull Long accountId) {
        User user = getCurrentUser();

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Verify ownership
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        return mapToAccountResponse(account);
    }

    /**
     * Create new account
     */
    @Transactional
    public AccountResponse createAccount(@Valid CreateAccountRequest request) {
        User user = getCurrentUser();

        // Validate account type
        if (!ACCOUNT_TYPES.contains(request.accountType())) {
            throw new IllegalArgumentException("Invalid account type");
        }

        // Generate unique account number
        String accountNumber = generateAccountNumber();

        // Create account
        Account account = new Account(
                accountNumber,
                user.getId(),
                request.accountType(),
                request.currency()
        );

        account.setNickname(request.nickname());
        accountRepository.save(account);

        // Create initial balance history
        createBalanceHistory(
                account,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                "ACCOUNT_CREATED",
                "Account created"
        );

        // Send notification
        createNotification(
                user.getId(),
                "Account Created",
                "Your " + request.accountType() + " account has been created successfully. Account number: " + accountNumber,
                "SUCCESS"
        );

        // Log activity
        logActivity(user, "ACCOUNT_CREATED", "Created " + request.accountType() + " account: " + accountNumber);

        return mapToAccountResponse(account);
    }

    /**
     * Update account
     */
    @Transactional
    public AccountResponse updateAccount(@NotNull Long accountId, UpdateAccountRequest request) {
        User user = getCurrentUser();

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Verify ownership
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Update only provided fields
        if (request.nickname() != null) {
            account.setNickname(request.nickname());
        }

        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);

        // Log activity
        logActivity(user, "ACCOUNT_UPDATED", "Updated account: " + account.getAccountNumber());

        return mapToAccountResponse(account);
    }

    /**
     * Close account (soft delete)
     */
    @Transactional
    public void closeAccount(@NotNull Long accountId) {
        User user = getCurrentUser();

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Verify ownership
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Check if account has balance
        if (account.getBalance().compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalArgumentException("Cannot close account with positive balance. Please transfer your funds first.");
        }

        // Check if it's the primary account
        if (account.isPrimary()) {
            throw new IllegalArgumentException("Cannot close primary account. Please set another account as primary first.");
        }

        // Soft delete
        account.setStatus("CLOSED");
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);

        // Create balance history
        createBalanceHistory(
                account,
                account.getBalance(),
                account.getBalance(),
                "ACCOUNT_CLOSED",
                "Account closed"
        );

        // Send notification
        createNotification(
                user.getId(),
                "Account Closed",
                "Your account " + account.getAccountNumber() + " has been closed successfully.",
                "INFO"
        );

        // Log activity
        logActivity(user, "ACCOUNT_CLOSED", "Closed account: " + account.getAccountNumber());
    }

    /**
     * Get account balance
     */
    public BalanceResponse getAccountBalance(@NotNull Long accountId) {
        User user = getCurrentUser();

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Verify ownership
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        return new BalanceResponse(
                account.getId(),
                account.getAccountNumber(),
                account.getBalance(),
                account.getCurrency(),
                account.getUpdatedAt()
        );
    }

    /**
     * Get balance history
     */
    public Page<BalanceHistoryResponse> getBalanceHistory(
            @NotNull Long accountId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        User user = getCurrentUser();

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Verify ownership
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        Page<BalanceHistory> history = balanceHistoryRepository
                .findByAccountIdAndRecordedAtBetweenOrderByRecordedAtDesc(
                        accountId, startDateTime, endDateTime, pageable
                );

        return history.map(this::mapToBalanceHistoryResponse);
    }

    /**
     * Get account statement
     */
    public StatementResponse getAccountStatement(
            @NotNull Long accountId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        User user = getCurrentUser();

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Verify ownership
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        // Get transactions for the period
        List<BalanceHistory> history = balanceHistoryRepository
                .findByAccountIdAndRecordedAtBetweenOrderByRecordedAtDesc(
                        accountId, startDateTime, endDateTime
                );

        BigDecimal openingBalance = getOpeningBalance(accountId, startDateTime);
        BigDecimal closingBalance = account.getBalance();

        BigDecimal totalCredits = history.stream()
                .filter(h -> h.getNewBalance().compareTo(h.getOldBalance()) > 0)
                .map(h -> h.getNewBalance().subtract(h.getOldBalance()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDebits = history.stream()
                .filter(h -> h.getNewBalance().compareTo(h.getOldBalance()) < 0)
                .map(h -> h.getOldBalance().subtract(h.getNewBalance()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new StatementResponse(
                account.getAccountNumber(),
                account.getAccountType(),
                startDate,
                endDate,
                openingBalance,
                closingBalance,
                totalCredits,
                totalDebits,
                history.size(),
                account.getCurrency()
        );
    }

    /**
     * Download statement
     */
    public byte[] downloadStatement(@NotNull Long accountId, DownloadStatementRequest request) {
        // Get statement data
        StatementResponse statement = getAccountStatement(
                accountId,
                request.startDate(),
                request.endDate()
        );

        // Generate PDF or CSV based on format
        if (request.format().equalsIgnoreCase("pdf")) {
            return generatePdfStatement(statement);
        } else if (request.format().equalsIgnoreCase("csv")) {
            return generateCsvStatement(statement);
        } else {
            throw new IllegalArgumentException("Invalid format. Supported formats: PDF, CSV");
        }
    }

    /**
     * Get account summary
     */
    public AccountSummaryResponse getAccountSummary(@NotNull Long accountId) {
        User user = getCurrentUser();

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Verify ownership
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Calculate summary data (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        List<BalanceHistory> recentHistory = balanceHistoryRepository
                .findByAccountIdAndRecordedAtAfter(accountId, thirtyDaysAgo);

        int transactionCount = recentHistory.size();

        BigDecimal totalCredits = recentHistory.stream()
                .filter(h -> h.getNewBalance().compareTo(h.getOldBalance()) > 0)
                .map(h -> h.getNewBalance().subtract(h.getOldBalance()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDebits = recentHistory.stream()
                .filter(h -> h.getNewBalance().compareTo(h.getOldBalance()) < 0)
                .map(h -> h.getOldBalance().subtract(h.getNewBalance()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal averageBalance = recentHistory.isEmpty()
                ? account.getBalance()
                : recentHistory.stream()
                .map(BalanceHistory::getNewBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(recentHistory.size()), 2, BigDecimal.ROUND_HALF_UP);

        return new AccountSummaryResponse(
                account.getId(),
                account.getAccountNumber(),
                account.getBalance(),
                transactionCount,
                totalCredits,
                totalDebits,
                averageBalance,
                account.getCurrency()
        );
    }

    /**
     * Set primary account
     */
    @Transactional
    public void setPrimaryAccount(@NotNull Long accountId) {
        User user = getCurrentUser();

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Verify ownership
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Check if account is active
        if (!account.getStatus().equals("ACTIVE")) {
            throw new IllegalArgumentException("Only active accounts can be set as primary");
        }

        // Unset other primary accounts
        List<Account> userAccounts = accountRepository.findByUserId(user.getId());
        userAccounts.forEach(acc -> {
            if (acc.isPrimary()) {
                acc.setPrimary(false);
                accountRepository.save(acc);
            }
        });

        // Set as primary
        account.setPrimary(true);
        accountRepository.save(account);

        // Send notification
        createNotification(
                user.getId(),
                "Primary Account Updated",
                "Account " + account.getAccountNumber() + " has been set as your primary account.",
                "INFO"
        );

        // Log activity
        logActivity(user, "PRIMARY_ACCOUNT_SET", "Set account as primary: " + account.getAccountNumber());
    }

    /**
     * Get all accounts summary
     */
    public AllAccountsSummaryResponse getAllAccountsSummary() {
        User user = getCurrentUser();

        List<Account> accounts = accountRepository.findByUserId(user.getId());

        int totalAccounts = accounts.size();
        int activeAccounts = (int) accounts.stream()
                .filter(acc -> acc.getStatus().equals("ACTIVE"))
                .count();

        BigDecimal totalBalance = accounts.stream()
                .filter(acc -> acc.getStatus().equals("ACTIVE"))
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Account primaryAccount = accounts.stream()
                .filter(Account::isPrimary)
                .findFirst()
                .orElse(null);

        return new AllAccountsSummaryResponse(
                totalAccounts,
                activeAccounts,
                totalBalance,
                primaryAccount != null ? primaryAccount.getAccountNumber() : null,
                accounts.stream().map(this::mapToAccountResponse).toList()
        );
    }

    /**
     * Freeze account
     */
    @Transactional
    public void freezeAccount(@NotNull Long accountId, String reason) {
        User user = getCurrentUser();

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Verify ownership
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        if (account.getStatus().equals("FROZEN")) {
            throw new IllegalArgumentException("Account is already frozen");
        }

        account.setStatus("FROZEN");
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);

        // Create balance history
        createBalanceHistory(
                account,
                account.getBalance(),
                account.getBalance(),
                "ACCOUNT_FROZEN",
                "Account frozen: " + reason
        );

        // Send notification
        createNotification(
                user.getId(),
                "Account Frozen",
                "Your account " + account.getAccountNumber() + " has been frozen. Reason: " + reason,
                "WARNING"
        );

        // Log activity
        logActivity(user, "ACCOUNT_FROZEN", "Frozen account: " + account.getAccountNumber() + " - Reason: " + reason);
    }

    /**
     * Unfreeze account
     */
    @Transactional
    public void unfreezeAccount(@NotNull Long accountId) {
        User user = getCurrentUser();

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Verify ownership
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        if (!account.getStatus().equals("FROZEN")) {
            throw new IllegalArgumentException("Account is not frozen");
        }

        account.setStatus("ACTIVE");
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);

        // Create balance history
        createBalanceHistory(
                account,
                account.getBalance(),
                account.getBalance(),
                "ACCOUNT_UNFROZEN",
                "Account unfrozen"
        );

        // Send notification
        createNotification(
                user.getId(),
                "Account Unfrozen",
                "Your account " + account.getAccountNumber() + " has been unfrozen and is now active.",
                "SUCCESS"
        );

        // Log activity
        logActivity(user, "ACCOUNT_UNFROZEN", "Unfrozen account: " + account.getAccountNumber());
    }

    /**
     * Get account types
     */
    public AccountTypesResponse getAccountTypes() {
        return new AccountTypesResponse(ACCOUNT_TYPES);
    }

    /**
     * Get account statistics
     */
    public AccountStatisticsResponse getAccountStatistics() {
        User user = getCurrentUser();

        List<Account> accounts = accountRepository.findByUserId(user.getId());

        long savingsCount = accounts.stream()
                .filter(acc -> acc.getAccountType().equals("SAVINGS"))
                .count();

        long checkingCount = accounts.stream()
                .filter(acc -> acc.getAccountType().equals("CHECKING"))
                .count();

        long businessCount = accounts.stream()
                .filter(acc -> acc.getAccountType().equals("BUSINESS"))
                .count();

        BigDecimal totalBalance = accounts.stream()
                .filter(acc -> acc.getStatus().equals("ACTIVE"))
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal savingsBalance = accounts.stream()
                .filter(acc -> acc.getAccountType().equals("SAVINGS") && acc.getStatus().equals("ACTIVE"))
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal checkingBalance = accounts.stream()
                .filter(acc -> acc.getAccountType().equals("CHECKING") && acc.getStatus().equals("ACTIVE"))
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new AccountStatisticsResponse(
                (int) savingsCount,
                (int) checkingCount,
                (int) businessCount,
                totalBalance,
                savingsBalance,
                checkingBalance
        );
    }

    // ==================== Helper Methods ====================

    /**
     * Generate unique account number
     */
    private String generateAccountNumber() {
        String accountNumber;
        do {
            long number = 1000000000L + (long) (random.nextDouble() * 9000000000L);
            accountNumber = ACCOUNT_PREFIX + number;
        } while (accountRepository.existsByAccountNumber(accountNumber));

        return accountNumber;
    }

    /**
     * Create balance history record
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
     * Get opening balance for period
     */
    private BigDecimal getOpeningBalance(Long accountId, LocalDateTime startDate) {
        return balanceHistoryRepository
                .findFirstByAccountIdAndRecordedAtBeforeOrderByRecordedAtDesc(accountId, startDate)
                .map(BalanceHistory::getNewBalance)
                .orElse(BigDecimal.ZERO);
    }

    /**
     * Generate PDF statement
     */
    private byte[] generatePdfStatement(StatementResponse statement) {
        // TODO: Implement proper PDF generation using iText or Apache PDFBox
        StringBuilder content = new StringBuilder();
        content.append("ACCOUNT STATEMENT\n\n");
        content.append("Account Number: ").append(statement.accountNumber()).append("\n");
        content.append("Account Type: ").append(statement.accountType()).append("\n");
        content.append("Period: ").append(statement.startDate()).append(" to ").append(statement.endDate()).append("\n\n");
        content.append("Opening Balance: ").append(statement.openingBalance()).append(" ").append(statement.currency()).append("\n");
        content.append("Closing Balance: ").append(statement.closingBalance()).append(" ").append(statement.currency()).append("\n");
        content.append("Total Credits: ").append(statement.totalCredits()).append(" ").append(statement.currency()).append("\n");
        content.append("Total Debits: ").append(statement.totalDebits()).append(" ").append(statement.currency()).append("\n");
        content.append("Total Transactions: ").append(statement.totalTransactions()).append("\n");

        return content.toString().getBytes();
    }

    /**
     * Generate CSV statement
     */
    private byte[] generateCsvStatement(StatementResponse statement) {
        StringBuilder csv = new StringBuilder();
        csv.append("Account Number,Account Type,Start Date,End Date,Opening Balance,Closing Balance,Total Credits,Total Debits,Total Transactions,Currency\n");
        csv.append(String.format("%s,%s,%s,%s,%s,%s,%s,%s,%d,%s\n",
                statement.accountNumber(),
                statement.accountType(),
                statement.startDate(),
                statement.endDate(),
                statement.openingBalance(),
                statement.closingBalance(),
                statement.totalCredits(),
                statement.totalDebits(),
                statement.totalTransactions(),
                statement.currency()
        ));
        return csv.toString().getBytes();
    }

    /**
     * Map Account to AccountResponse
     */
    private AccountResponse mapToAccountResponse(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getAccountNumber(),
                account.getAccountType(),
                account.getBalance(),
                account.getCurrency(),
                account.getStatus(),
                account.getNickname(),
                account.isPrimary(),
                account.getCreatedAt(),
                account.getUpdatedAt()
        );
    }

    /**
     * Map BalanceHistory to BalanceHistoryResponse
     */
    private BalanceHistoryResponse mapToBalanceHistoryResponse(BalanceHistory history) {
        return new BalanceHistoryResponse(
                history.getId(),
                history.getOldBalance(),
                history.getNewBalance(),
                history.getTransactionType(),
                history.getDescription(),
                history.getRecordedAt()
        );
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
            // Log error but don't throw exception
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
}