package com.bank.bankbackend.transfer.service;

import com.bank.bankbackend.account.entity.Account;
import com.bank.bankbackend.account.entity.BalanceHistory;
import com.bank.bankbackend.account.repository.AccountRepository;
import com.bank.bankbackend.account.repository.BalanceHistoryRepository;
import com.bank.bankbackend.security.userdetails.UserDetailsImpl;
import com.bank.bankbackend.transaction.entity.Transaction;
import com.bank.bankbackend.transaction.repository.TransactionRepository;
import com.bank.bankbackend.transfer.dto.*;
import com.bank.bankbackend.transfer.entity.RecurringTransfer;
import com.bank.bankbackend.transfer.entity.Transfer;
import com.bank.bankbackend.transfer.repository.RecurringTransferRepository;
import com.bank.bankbackend.transfer.repository.TransferRepository;
import com.bank.bankbackend.user.entity.Notification;
import com.bank.bankbackend.user.entity.User;
import com.bank.bankbackend.user.entity.UserActivity;
import com.bank.bankbackend.user.repository.NotificationRepository;
import com.bank.bankbackend.user.repository.UserActivityRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class TransferService {

    private static final Logger logger = LoggerFactory.getLogger(TransferService.class);

    private final TransferRepository transferRepository;
    private final RecurringTransferRepository recurringTransferRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final BalanceHistoryRepository balanceHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final UserActivityRepository userActivityRepository;

    // Transfer limits
    private static final BigDecimal MAX_INTERNAL_TRANSFER = new BigDecimal("100000.00");
    private static final BigDecimal MAX_EXTERNAL_TRANSFER = new BigDecimal("50000.00");
    private static final BigDecimal DAILY_TRANSFER_LIMIT = new BigDecimal("200000.00");

    public TransferService(
            TransferRepository transferRepository,
            RecurringTransferRepository recurringTransferRepository,
            AccountRepository accountRepository,
            TransactionRepository transactionRepository,
            BalanceHistoryRepository balanceHistoryRepository,
            NotificationRepository notificationRepository,
            UserActivityRepository userActivityRepository
    ) {
        this.transferRepository = transferRepository;
        this.recurringTransferRepository = recurringTransferRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
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
     * Internal transfer (between own accounts)
     */
    @Transactional
    public TransferResponse internalTransfer(@Valid InternalTransferRequest request) {
        User user = getCurrentUser();

        // Get and verify source account with pessimistic lock
        Account sourceAccount = accountRepository.findByIdWithLock(request.fromAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Source account not found"));
        
        if (!sourceAccount.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied to source account");
        }

        // Get and verify destination account with pessimistic lock
        Account destinationAccount = accountRepository.findByIdWithLock(request.toAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Destination account not found"));
        
        if (!destinationAccount.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied to destination account");
        }

        // Validate accounts
        validateTransfer(sourceAccount, destinationAccount, request.amount(), "INTERNAL");

        // Check transfer limit
        if (request.amount().compareTo(MAX_INTERNAL_TRANSFER) > 0) {
            throw new IllegalArgumentException("Amount exceeds internal transfer limit of " + MAX_INTERNAL_TRANSFER);
        }

        // Create transfer
        String reference = generateTransferReference();
        Transfer transfer = new Transfer(
                sourceAccount.getId(),
                destinationAccount.getId(),
                "INTERNAL",
                request.amount(),
                sourceAccount.getCurrency(),
                reference,
                request.description()
        );
        transfer.setStatus("COMPLETED");
        transferRepository.save(transfer);

        // Process transfer immediately
        processTransfer(transfer, sourceAccount, destinationAccount);

        // Log activity
        logActivity(user, "INTERNAL_TRANSFER", 
                String.format("Internal transfer of %.2f %s from %s to %s", 
                        request.amount(), sourceAccount.getCurrency(), 
                        sourceAccount.getAccountNumber(), destinationAccount.getAccountNumber()));

        return mapToTransferResponse(transfer);
    }

    /**
     * External transfer (to another user's account)
     */
    @Transactional
    public TransferResponse externalTransfer(@Valid ExternalTransferRequest request) {
        User user = getCurrentUser();

        // Get and verify source account with pessimistic lock
        Account sourceAccount = accountRepository.findByIdWithLock(request.fromAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Source account not found"));
        
        if (!sourceAccount.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied to source account");
        }

        // Get destination account by account number
        // Note: We can't easily lock by non-ID field with standard JPA method, 
        // so we fetch ID first then lock
        Account destinationAccountTemp = accountRepository.findByAccountNumber(request.toAccountNumber())
                .orElseThrow(() -> new IllegalArgumentException("Destination account not found"));
        
        Account destinationAccount = accountRepository.findByIdWithLock(destinationAccountTemp.getId())
                .orElseThrow(() -> new IllegalArgumentException("Destination account not found"));

        // Validate accounts
        validateTransfer(sourceAccount, destinationAccount, request.amount(), "EXTERNAL");

        // Check transfer limit
        if (request.amount().compareTo(MAX_EXTERNAL_TRANSFER) > 0) {
            throw new IllegalArgumentException("Amount exceeds external transfer limit of " + MAX_EXTERNAL_TRANSFER);
        }

        // Check daily limit
        checkDailyLimit(user.getId(), request.amount());

        // Create transfer
        String reference = generateTransferReference();
        Transfer transfer = new Transfer(
                sourceAccount.getId(),
                destinationAccount.getId(),
                "EXTERNAL",
                request.amount(),
                sourceAccount.getCurrency(),
                reference,
                request.description()
        );
        transfer.setRecipientName(request.recipientName());
        transfer.setStatus("COMPLETED");
        transferRepository.save(transfer);

        // Process transfer immediately
        processTransfer(transfer, sourceAccount, destinationAccount);

        // Send notification to recipient
        createNotification(
                destinationAccount.getUserId(),
                "Transfer Received",
                String.format("You received %.2f %s from %s", 
                        request.amount(), sourceAccount.getCurrency(), user.getUsername()),
                "SUCCESS"
        );

        // Log activity
        logActivity(user, "EXTERNAL_TRANSFER", 
                String.format("External transfer of %.2f %s to account %s", 
                        request.amount(), sourceAccount.getCurrency(), 
                        destinationAccount.getAccountNumber()));

        return mapToTransferResponse(transfer);
    }

    /**
     * Schedule transfer for future date
     */
    @Transactional
    public TransferResponse scheduleTransfer(@Valid ScheduledTransferRequest request) {
        User user = getCurrentUser();

        // Validate scheduled date
        if (request.scheduledDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Scheduled date must be in the future");
        }

        // Get and verify source account
        Account sourceAccount = accountRepository.findById(request.fromAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Source account not found"));
        
        if (!sourceAccount.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied to source account");
        }

        // Get destination account
        Account destinationAccount;
        if (request.toAccountId() != null) {
            // Internal transfer
            destinationAccount = accountRepository.findById(request.toAccountId())
                    .orElseThrow(() -> new IllegalArgumentException("Destination account not found"));
        } else {
            // External transfer
            destinationAccount = accountRepository.findByAccountNumber(request.toAccountNumber())
                    .orElseThrow(() -> new IllegalArgumentException("Destination account not found"));
        }

        // Create scheduled transfer
        String reference = generateTransferReference();
        Transfer transfer = new Transfer(
                sourceAccount.getId(),
                destinationAccount.getId(),
                request.toAccountId() != null ? "INTERNAL" : "EXTERNAL",
                request.amount(),
                sourceAccount.getCurrency(),
                reference,
                request.description()
        );
        transfer.setScheduledDate(request.scheduledDate().atStartOfDay());
        transfer.setStatus("SCHEDULED");
        transferRepository.save(transfer);

        // Send notification
        createNotification(
                user.getId(),
                "Transfer Scheduled",
                String.format("Transfer of %.2f %s scheduled for %s", 
                        request.amount(), sourceAccount.getCurrency(), request.scheduledDate()),
                "INFO"
        );

        // Log activity
        logActivity(user, "TRANSFER_SCHEDULED", 
                String.format("Scheduled transfer of %.2f %s for %s", 
                        request.amount(), sourceAccount.getCurrency(), request.scheduledDate()));

        return mapToTransferResponse(transfer);
    }

    /**
     * Create recurring transfer
     */
    @Transactional
    public RecurringTransferResponse createRecurringTransfer(@Valid RecurringTransferRequest request) {
        User user = getCurrentUser();

        // Get and verify source account
        Account sourceAccount = accountRepository.findById(request.fromAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Source account not found"));
        
        if (!sourceAccount.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied to source account");
        }

        // Get destination account
        Account destinationAccount;
        if (request.toAccountId() != null) {
            destinationAccount = accountRepository.findById(request.toAccountId())
                    .orElseThrow(() -> new IllegalArgumentException("Destination account not found"));
        } else {
            destinationAccount = accountRepository.findByAccountNumber(request.toAccountNumber())
                    .orElseThrow(() -> new IllegalArgumentException("Destination account not found"));
        }

        // Create recurring transfer
        RecurringTransfer recurringTransfer = new RecurringTransfer(
                sourceAccount.getId(),
                destinationAccount.getId(),
                request.toAccountId() != null ? "INTERNAL" : "EXTERNAL",
                request.amount(),
                sourceAccount.getCurrency(),
                request.frequency(),
                request.startDate(),
                request.description()
        );
        recurringTransfer.setEndDate(request.endDate());
        recurringTransferRepository.save(recurringTransfer);

        // Send notification
        createNotification(
                user.getId(),
                "Recurring Transfer Created",
                String.format("Recurring %s transfer of %.2f %s created", 
                        request.frequency(), request.amount(), sourceAccount.getCurrency()),
                "SUCCESS"
        );

        // Log activity
        logActivity(user, "RECURRING_TRANSFER_CREATED", 
                String.format("Created %s recurring transfer of %.2f %s", 
                        request.frequency(), request.amount(), sourceAccount.getCurrency()));

        return mapToRecurringTransferResponse(recurringTransfer);
    }

    /**
     * Get transfers with filters
     */
    public Page<TransferResponse> getTransfers(
            Long accountId,
            String type,
            String status,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        logger.info("Fetching transfers with filters: accountId={}, type={}, status={}, startDate={}, endDate={}",
                accountId, type, status, startDate, endDate);
        try {
            User user = getCurrentUser();
            logger.info("Authenticated user: {}", user.getUsername());

            // Filter by user's accounts
            List<Long> userAccountIds = accountRepository.findByUserId(user.getId())
                    .stream()
                    .map(Account::getId)
                    .toList();
            logger.info("Found {} accounts for user: {}", userAccountIds.size(), userAccountIds);

            if (userAccountIds.isEmpty()) {
                logger.warn("User {} has no accounts. Returning empty page.", user.getUsername());
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }

            // Build specification
            logger.debug("Building specification for transfer query.");
            Specification<Transfer> spec = Specification.where((root, query, cb) ->
                    cb.or(
                            root.get("fromAccountId").in(userAccountIds),
                            root.get("toAccountId").in(userAccountIds)
                    )
            );

            // Apply filters
            if (accountId != null) {
                logger.debug("Applying accountId filter: {}", accountId);
                spec = spec.and((root, query, cb) ->
                        cb.or(
                                cb.equal(root.get("fromAccountId"), accountId),
                                cb.equal(root.get("toAccountId"), accountId)
                        )
                );
            }
            if (type != null) {
                logger.debug("Applying type filter: {}", type);
                spec = spec.and((root, query, cb) -> cb.equal(root.get("transferType"), type));
            }
            if (status != null) {
                logger.debug("Applying status filter: {}", status);
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
            }
            if (startDate != null) {
                logger.debug("Applying startDate filter: {}", startDate);
                spec = spec.and((root, query, cb) ->
                        cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
            }
            if (endDate != null) {
                logger.debug("Applying endDate filter: {}", endDate);
                spec = spec.and((root, query, cb) ->
                        cb.lessThanOrEqualTo(root.get("createdAt"), endDate.atTime(23, 59, 59)));
            }

            logger.info("Executing findAll transfers query.");
            Page<Transfer> transfers = transferRepository.findAll(spec, pageable);
            logger.info("Found {} transfers.", transfers.getTotalElements());

            return transfers.map(this::mapToTransferResponse);
        } catch (Exception e) {
            logger.error("Error fetching transfers: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get transfer by ID
     */
    public TransferResponse getTransferById(@NotNull Long transferId) {
        User user = getCurrentUser();

        Transfer transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer not found"));

        // Verify ownership
        verifyTransferOwnership(user, transfer);

        return mapToTransferResponse(transfer);
    }

    /**
     * Get pending transfers
     */
    public Page<TransferResponse> getPendingTransfers(Pageable pageable) {
        User user = getCurrentUser();

        List<Long> userAccountIds = accountRepository.findByUserId(user.getId())
                .stream()
                .map(Account::getId)
                .toList();

        if (userAccountIds.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        Page<Transfer> transfers = transferRepository
                .findByFromAccountIdInAndStatusOrderByCreatedAtDesc(
                        userAccountIds, "PENDING", pageable
                );

        return transfers.map(this::mapToTransferResponse);
    }

    /**
     * Get scheduled transfers
     */
    public Page<TransferResponse> getScheduledTransfers(Pageable pageable) {
        User user = getCurrentUser();

        List<Long> userAccountIds = accountRepository.findByUserId(user.getId())
                .stream()
                .map(Account::getId)
                .toList();

        if (userAccountIds.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        Page<Transfer> transfers = transferRepository
                .findByFromAccountIdInAndStatusOrderByScheduledDateAsc(
                        userAccountIds, "SCHEDULED", pageable
                );

        return transfers.map(this::mapToTransferResponse);
    }

    /**
     * Get recurring transfers
     */
    public Page<RecurringTransferResponse> getRecurringTransfers(Boolean activeOnly, Pageable pageable) {
        User user = getCurrentUser();

        List<Long> userAccountIds = accountRepository.findByUserId(user.getId())
                .stream()
                .map(Account::getId)
                .toList();

        if (userAccountIds.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        Page<RecurringTransfer> transfers;
        
        if (activeOnly != null && activeOnly) {
            transfers = recurringTransferRepository
                    .findByFromAccountIdInAndIsActiveOrderByCreatedAtDesc(
                            userAccountIds, true, pageable
                    );
        } else {
            transfers = recurringTransferRepository
                    .findByFromAccountIdInOrderByCreatedAtDesc(
                            userAccountIds, pageable
                    );
        }

        return transfers.map(this::mapToRecurringTransferResponse);
    }

    /**
     * Cancel transfer
     */
    @Transactional
    public void cancelTransfer(@NotNull Long transferId) {
        User user = getCurrentUser();

        Transfer transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer not found"));

        // Verify ownership
        verifyTransferOwnership(user, transfer);

        // Check if can be cancelled
        if (!transfer.getStatus().equals("PENDING") && !transfer.getStatus().equals("SCHEDULED")) {
            throw new IllegalArgumentException("Only pending or scheduled transfers can be cancelled");
        }

        // Update status
        transfer.setStatus("CANCELLED");
        transferRepository.save(transfer);

        // Send notification
        createNotification(
                user.getId(),
                "Transfer Cancelled",
                "Transfer " + transfer.getReference() + " has been cancelled.",
                "INFO"
        );

        // Log activity
        logActivity(user, "TRANSFER_CANCELLED", 
                "Cancelled transfer: " + transfer.getReference());
    }

    /**
     * Cancel recurring transfer
     */
    @Transactional
    public void cancelRecurringTransfer(@NotNull Long recurringTransferId) {
        User user = getCurrentUser();

        RecurringTransfer recurringTransfer = recurringTransferRepository.findById(recurringTransferId)
                .orElseThrow(() -> new IllegalArgumentException("Recurring transfer not found"));

        // Verify ownership
        Account account = accountRepository.findById(recurringTransfer.getFromAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Deactivate
        recurringTransfer.setActive(false);
        recurringTransferRepository.save(recurringTransfer);

        // Send notification
        createNotification(
                user.getId(),
                "Recurring Transfer Cancelled",
                "Recurring transfer has been cancelled.",
                "INFO"
        );

        // Log activity
        logActivity(user, "RECURRING_TRANSFER_CANCELLED", 
                String.format("Cancelled %s recurring transfer of %.2f %s", 
                        recurringTransfer.getFrequency(), recurringTransfer.getAmount(), 
                        recurringTransfer.getCurrency()));
    }

    /**
     * Get transfer receipt
     */
    public TransferReceiptResponse getTransferReceipt(@NotNull Long transferId) {
        User user = getCurrentUser();

        Transfer transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer not found"));

        // Verify ownership
        verifyTransferOwnership(user, transfer);

        Account fromAccount = accountRepository.findById(transfer.getFromAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Source account not found"));
        
        Account toAccount = accountRepository.findById(transfer.getToAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Destination account not found"));

        return new TransferReceiptResponse(
                transfer.getId(),
                transfer.getReference(),
                transfer.getTransferType(),
                transfer.getAmount(),
                transfer.getCurrency(),
                fromAccount.getAccountNumber(),
                toAccount.getAccountNumber(),
                transfer.getRecipientName(),
                transfer.getDescription(),
                transfer.getStatus(),
                transfer.getCreatedAt()
        );
    }

    /**
     * Verify account number
     */
    public VerifyAccountResponse verifyAccount(@NotBlank String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        // Don't expose full user details for security
        return new VerifyAccountResponse(
                true,
                account.getAccountNumber(),
                account.getAccountType(),
                "Account verified"
        );
    }

    /**
     * Get transfer statistics
     */
    public TransferStatisticsResponse getTransferStatistics(LocalDate startDate, LocalDate endDate) {
        User user = getCurrentUser();

        // Set default date range if not provided
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        List<Long> userAccountIds = accountRepository.findByUserId(user.getId())
                .stream()
                .map(Account::getId)
                .toList();

        if (userAccountIds.isEmpty()) {
            return new TransferStatisticsResponse(0, 0, 0, BigDecimal.ZERO, 0, 0);
        }

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        List<Transfer> transfers = transferRepository
                .findByFromAccountIdInAndCreatedAtBetween(userAccountIds, start, end);

        int totalTransfers = transfers.size();
        
        long internalCount = transfers.stream()
                .filter(t -> t.getTransferType().equals("INTERNAL"))
                .count();
        
        long externalCount = transfers.stream()
                .filter(t -> t.getTransferType().equals("EXTERNAL"))
                .count();

        BigDecimal totalAmount = transfers.stream()
                .filter(t -> t.getStatus().equals("COMPLETED"))
                .map(Transfer::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long completedCount = transfers.stream()
                .filter(t -> t.getStatus().equals("COMPLETED"))
                .count();

        long pendingCount = transfers.stream()
                .filter(t -> t.getStatus().equals("PENDING"))
                .count();

        return new TransferStatisticsResponse(
                totalTransfers,
                (int) internalCount,
                (int) externalCount,
                totalAmount,
                (int) completedCount,
                (int) pendingCount
        );
    }

    /**
     * Get transfer limits
     */
    public TransferLimitsResponse getTransferLimits() {
        return new TransferLimitsResponse(
                MAX_INTERNAL_TRANSFER,
                MAX_EXTERNAL_TRANSFER,
                DAILY_TRANSFER_LIMIT
        );
    }

    // ==================== Helper Methods ====================

    /**
     * Generate unique transfer reference
     */
    private String generateTransferReference() {
        return "TRF" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    /**
     * Validate transfer
     */
    private void validateTransfer(Account source, Account destination, BigDecimal amount, String type) {
        // Check if accounts are the same
        if (source.getId().equals(destination.getId())) {
            throw new IllegalArgumentException("Cannot transfer to the same account");
        }

        // Check source account is active
        if (!source.getStatus().equals("ACTIVE")) {
            throw new IllegalArgumentException("Source account is not active");
        }

        // Check destination account is active
        if (!destination.getStatus().equals("ACTIVE")) {
            throw new IllegalArgumentException("Destination account is not active");
        }

        // Check sufficient balance
        if (source.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient balance");
        }

        // Check currency match
        if (!source.getCurrency().equals(destination.getCurrency())) {
            throw new IllegalArgumentException("Currency mismatch. Currency conversion not yet supported.");
        }

        // Check minimum amount
        if (amount.compareTo(new BigDecimal("0.01")) < 0) {
            throw new IllegalArgumentException("Amount must be greater than 0.01");
        }
    }

    /**
     * Process transfer
     */
    private void processTransfer(Transfer transfer, Account source, Account destination) {
        // Deduct from source
        BigDecimal sourceOldBalance = source.getBalance();
        BigDecimal sourceNewBalance = sourceOldBalance.subtract(transfer.getAmount());
        source.setBalance(sourceNewBalance);
        source.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(source);

        // Add to destination
        BigDecimal destOldBalance = destination.getBalance();
        BigDecimal destNewBalance = destOldBalance.add(transfer.getAmount());
        destination.setBalance(destNewBalance);
        destination.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(destination);

        // Create balance history for source
        createBalanceHistory(source, sourceOldBalance, sourceNewBalance, 
                "TRANSFER_OUT", "Transfer to " + destination.getAccountNumber());

        // Create balance history for destination
        createBalanceHistory(destination, destOldBalance, destNewBalance, 
                "TRANSFER_IN", "Transfer from " + source.getAccountNumber());

        // Create transactions
        createTransaction(source.getId(), "TRANSFER_OUT", transfer.getAmount(), 
                source.getCurrency(), transfer.getReference() + "_OUT", transfer.getDescription());
        
        createTransaction(destination.getId(), "TRANSFER_IN", transfer.getAmount(), 
                destination.getCurrency(), transfer.getReference() + "_IN", transfer.getDescription());

        // Get source account owner
        Account sourceAccountFull = accountRepository.findById(source.getId()).orElseThrow();
        
        // Send notification to sender
        createNotification(
                sourceAccountFull.getUserId(),
                "Transfer Completed",
                String.format("%.2f %s transferred successfully", 
                        transfer.getAmount(), source.getCurrency()),
                "SUCCESS"
        );
    }

    /**
     * Check daily transfer limit
     */
    private void checkDailyLimit(Long userId, BigDecimal amount) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(23, 59, 59);

        List<Long> userAccountIds = accountRepository.findByUserId(userId)
                .stream()
                .map(Account::getId)
                .toList();

        List<Transfer> todayTransfers = transferRepository
                .findByFromAccountIdInAndCreatedAtBetween(userAccountIds, startOfDay, endOfDay);

        BigDecimal todayTotal = todayTransfers.stream()
                .filter(t -> t.getStatus().equals("COMPLETED"))
                .map(Transfer::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (todayTotal.add(amount).compareTo(DAILY_TRANSFER_LIMIT) > 0) {
            throw new IllegalArgumentException("Daily transfer limit exceeded");
        }
    }

    /**
     * Verify transfer ownership
     */
    private void verifyTransferOwnership(User user, Transfer transfer) {
        Account fromAccount = accountRepository.findById(transfer.getFromAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        
        Account toAccount = accountRepository.findById(transfer.getToAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        
        if (!fromAccount.getUserId().equals(user.getId()) && !toAccount.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }
    }

    /**
     * Create balance history
     */
    private void createBalanceHistory(Account account, BigDecimal oldBalance, BigDecimal newBalance,
                                     String type, String description) {
        BalanceHistory history = new BalanceHistory(
                account.getId(), oldBalance, newBalance, type, description
        );
        balanceHistoryRepository.save(history);
    }

    /**
     * Create transaction
     */
    private void createTransaction(Long accountId, String type, BigDecimal amount,
                                  String currency, String reference, String description) {
        Transaction transaction = new Transaction(
                accountId, type, amount, currency, reference, description
        );
        transaction.setStatus("COMPLETED");
        transactionRepository.save(transaction);
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
                    user.getId(), action, description, ipAddress, userAgent
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
     * Map Transfer to TransferResponse
     */
    private TransferResponse mapToTransferResponse(Transfer transfer) {
        return new TransferResponse(
                transfer.getId(),
                transfer.getFromAccountId(),
                transfer.getToAccountId(),
                transfer.getTransferType(),
                transfer.getAmount(),
                transfer.getCurrency(),
                transfer.getReference(),
                transfer.getRecipientName(),
                transfer.getDescription(),
                transfer.getStatus(),
                transfer.getScheduledDate(),
                transfer.getCreatedAt()
        );
    }

    /**
     * Map RecurringTransfer to RecurringTransferResponse
     */
    private RecurringTransferResponse mapToRecurringTransferResponse(RecurringTransfer transfer) {
        return new RecurringTransferResponse(
                transfer.getId(),
                transfer.getFromAccountId(),
                transfer.getToAccountId(),
                transfer.getTransferType(),
                transfer.getAmount(),
                transfer.getCurrency(),
                transfer.getFrequency(),
                transfer.getStartDate(),
                transfer.getEndDate(),
                transfer.getNextExecutionDate(),
                transfer.getDescription(),
                transfer.isActive(),
                transfer.getCreatedAt()
        );
    }
}