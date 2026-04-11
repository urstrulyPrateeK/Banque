package dev.prateek.banque.payment.service;

import dev.prateek.banque.account.entity.Account;
import dev.prateek.banque.account.entity.BalanceHistory;
import dev.prateek.banque.account.repository.AccountRepository;
import dev.prateek.banque.account.repository.BalanceHistoryRepository;
import dev.prateek.banque.payment.dto.*;
import dev.prateek.banque.payment.entity.Payment;
import dev.prateek.banque.payment.entity.RecurringPayment;
import dev.prateek.banque.payment.entity.SavedBiller;
import dev.prateek.banque.payment.repository.PaymentRepository;
import dev.prateek.banque.payment.repository.RecurringPaymentRepository;
import dev.prateek.banque.payment.repository.SavedBillerRepository;
import dev.prateek.banque.security.userdetails.UserDetailsImpl;
import dev.prateek.banque.transaction.entity.Transaction;
import dev.prateek.banque.transaction.repository.TransactionRepository;
import dev.prateek.banque.user.entity.Notification;
import dev.prateek.banque.user.entity.User;
import dev.prateek.banque.user.entity.UserActivity;
import dev.prateek.banque.user.repository.NotificationRepository;
import dev.prateek.banque.user.repository.UserActivityRepository;
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
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final RecurringPaymentRepository recurringPaymentRepository;
    private final SavedBillerRepository savedBillerRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final BalanceHistoryRepository balanceHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final UserActivityRepository userActivityRepository;

    // Payment categories
    private static final List<String> PAYMENT_CATEGORIES = Arrays.asList(
            "UTILITIES", "TELECOM", "INSURANCE", "EDUCATION", "HEALTHCARE",
            "ENTERTAINMENT", "SUBSCRIPTION", "LOANS", "CREDIT_CARD", "TAX", "OTHER"
    );

    // Payment types
    private static final List<String> PAYMENT_TYPES = Arrays.asList(
            "BILL", "UTILITY", "MERCHANT", "SCHEDULED", "RECURRING"
    );

    public PaymentService(
            PaymentRepository paymentRepository,
            RecurringPaymentRepository recurringPaymentRepository,
            SavedBillerRepository savedBillerRepository,
            AccountRepository accountRepository,
            TransactionRepository transactionRepository,
            BalanceHistoryRepository balanceHistoryRepository,
            NotificationRepository notificationRepository,
            UserActivityRepository userActivityRepository
    ) {
        this.paymentRepository = paymentRepository;
        this.recurringPaymentRepository = recurringPaymentRepository;
        this.savedBillerRepository = savedBillerRepository;
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
     * Pay bill
     */
    @Transactional
    public PaymentResponse payBill(@Valid BillPaymentRequest request) {
        User user = getCurrentUser();

        // Get and verify account
        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Validate account and amount
        validatePayment(account, request.amount());

        // Create payment
        String reference = generatePaymentReference();
        Payment payment = new Payment(
                account.getId(),
                "BILL",
                request.category(),
                request.amount(),
                account.getCurrency(),
                reference,
                request.billerName(),
                request.accountNumber(),
                request.description()
        );
        payment.setStatus("COMPLETED");
        paymentRepository.save(payment);

        // Process payment
        processPayment(payment, account);

        // Log activity
        logActivity(user, "BILL_PAYMENT", 
                String.format("Bill payment of %.2f %s to %s", 
                        request.amount(), account.getCurrency(), request.billerName()));

        return mapToPaymentResponse(payment);
    }

    /**
     * Pay utility
     */
    @Transactional
    public PaymentResponse payUtility(@Valid UtilityPaymentRequest request) {
        User user = getCurrentUser();

        // Get and verify account
        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Validate account and amount
        validatePayment(account, request.amount());

        // Create payment
        String reference = generatePaymentReference();
        Payment payment = new Payment(
                account.getId(),
                "UTILITY",
                request.utilityType(),
                request.amount(),
                account.getCurrency(),
                reference,
                request.providerName(),
                request.meterNumber(),
                request.description()
        );
        payment.setStatus("COMPLETED");
        paymentRepository.save(payment);

        // Process payment
        processPayment(payment, account);

        // Log activity
        logActivity(user, "UTILITY_PAYMENT", 
                String.format("Utility payment of %.2f %s to %s", 
                        request.amount(), account.getCurrency(), request.providerName()));

        return mapToPaymentResponse(payment);
    }

    /**
     * Pay merchant
     */
    @Transactional
    public PaymentResponse payMerchant(@Valid MerchantPaymentRequest request) {
        User user = getCurrentUser();

        // Get and verify account
        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Validate account and amount
        validatePayment(account, request.amount());

        // Create payment
        String reference = generatePaymentReference();
        Payment payment = new Payment(
                account.getId(),
                "MERCHANT",
                request.category(),
                request.amount(),
                account.getCurrency(),
                reference,
                request.merchantName(),
                request.merchantId(),
                request.description()
        );
        payment.setStatus("COMPLETED");
        paymentRepository.save(payment);

        // Process payment
        processPayment(payment, account);

        // Log activity
        logActivity(user, "MERCHANT_PAYMENT", 
                String.format("Merchant payment of %.2f %s to %s", 
                        request.amount(), account.getCurrency(), request.merchantName()));

        return mapToPaymentResponse(payment);
    }

    /**
     * Schedule payment
     */
    @Transactional
    public PaymentResponse schedulePayment(@Valid SchedulePaymentRequest request) {
        User user = getCurrentUser();

        // Validate scheduled date
        if (request.scheduledDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Scheduled date must be in the future");
        }

        // Get and verify account
        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Create scheduled payment
        String reference = generatePaymentReference();
        Payment payment = new Payment(
                account.getId(),
                request.paymentType(),
                request.category(),
                request.amount(),
                account.getCurrency(),
                reference,
                request.payeeName(),
                request.payeeAccount(),
                request.description()
        );
        payment.setScheduledDate(request.scheduledDate().atStartOfDay());
        payment.setStatus("SCHEDULED");
        paymentRepository.save(payment);

        // Send notification
        createNotification(
                user.getId(),
                "Payment Scheduled",
                String.format("Payment of %.2f %s scheduled for %s", 
                        request.amount(), account.getCurrency(), request.scheduledDate()),
                "INFO"
        );

        // Log activity
        logActivity(user, "PAYMENT_SCHEDULED", 
                String.format("Scheduled payment of %.2f %s for %s", 
                        request.amount(), account.getCurrency(), request.scheduledDate()));

        return mapToPaymentResponse(payment);
    }

    /**
     * Create recurring payment
     */
    @Transactional
    public RecurringPaymentResponse createRecurringPayment(@Valid RecurringPaymentRequest request) {
        User user = getCurrentUser();

        // Get and verify account
        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Create recurring payment
        RecurringPayment recurringPayment = new RecurringPayment(
                account.getId(),
                request.paymentType(),
                request.category(),
                request.amount(),
                account.getCurrency(),
                request.frequency(),
                request.startDate(),
                request.payeeName(),
                request.payeeAccount(),
                request.description()
        );
        recurringPayment.setEndDate(request.endDate());
        recurringPaymentRepository.save(recurringPayment);

        // Send notification
        createNotification(
                user.getId(),
                "Recurring Payment Created",
                String.format("Recurring %s payment of %.2f %s created", 
                        request.frequency(), request.amount(), account.getCurrency()),
                "SUCCESS"
        );

        // Log activity
        logActivity(user, "RECURRING_PAYMENT_CREATED", 
                String.format("Created %s recurring payment of %.2f %s", 
                        request.frequency(), request.amount(), account.getCurrency()));

        return mapToRecurringPaymentResponse(recurringPayment);
    }

    /**
     * Get payments with filters
     */
    public Page<PaymentResponse> getPayments(
            Long accountId,
            String type,
            String category,
            String status,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        logger.info("Fetching payments with filters: accountId={}, type={}, category={}, status={}, startDate={}, endDate={}",
                accountId, type, category, status, startDate, endDate);
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
            logger.debug("Building specification for payment query.");
            Specification<Payment> spec = Specification.where((root, query, cb) -> root.get("accountId").in(userAccountIds));

            // Apply filters
            if (accountId != null) {
                logger.debug("Applying accountId filter: {}", accountId);
                spec = spec.and((root, query, cb) -> cb.equal(root.get("accountId"), accountId));
            }
            if (type != null) {
                logger.debug("Applying type filter: {}", type);
                spec = spec.and((root, query, cb) -> cb.equal(root.get("paymentType"), type));
            }
            if (category != null) {
                logger.debug("Applying category filter: {}", category);
                spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), category));
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

            logger.info("Executing findAll payments query.");
            Page<Payment> payments = paymentRepository.findAll(spec, pageable);
            logger.info("Found {} payments.", payments.getTotalElements());

            return payments.map(this::mapToPaymentResponse);
        } catch (Exception e) {
            logger.error("Error fetching payments: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get payment by ID
     */
    public PaymentResponse getPaymentById(@NotNull Long paymentId) {
        User user = getCurrentUser();

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        // Verify ownership
        verifyPaymentOwnership(user, payment);

        return mapToPaymentResponse(payment);
    }

    /**
     * Get pending payments
     */
    public Page<PaymentResponse> getPendingPayments(Pageable pageable) {
        User user = getCurrentUser();

        List<Long> userAccountIds = accountRepository.findByUserId(user.getId())
                .stream()
                .map(Account::getId)
                .toList();

        if (userAccountIds.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        Page<Payment> payments = paymentRepository
                .findByAccountIdInAndStatusOrderByCreatedAtDesc(
                        userAccountIds, "PENDING", pageable
                );

        return payments.map(this::mapToPaymentResponse);
    }

    /**
     * Get scheduled payments
     */
    public Page<PaymentResponse> getScheduledPayments(Pageable pageable) {
        User user = getCurrentUser();

        List<Long> userAccountIds = accountRepository.findByUserId(user.getId())
                .stream()
                .map(Account::getId)
                .toList();

        if (userAccountIds.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        Page<Payment> payments = paymentRepository
                .findByAccountIdInAndStatusOrderByScheduledDateAsc(
                        userAccountIds, "SCHEDULED", pageable
                );

        return payments.map(this::mapToPaymentResponse);
    }

    /**
     * Get recurring payments
     */
    public Page<RecurringPaymentResponse> getRecurringPayments(Boolean activeOnly, Pageable pageable) {
        User user = getCurrentUser();

        List<Long> userAccountIds = accountRepository.findByUserId(user.getId())
                .stream()
                .map(Account::getId)
                .toList();

        if (userAccountIds.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        Page<RecurringPayment> payments;
        
        if (activeOnly != null && activeOnly) {
            payments = recurringPaymentRepository
                    .findByAccountIdInAndIsActiveOrderByCreatedAtDesc(
                            userAccountIds, true, pageable
                    );
        } else {
            payments = recurringPaymentRepository
                    .findByAccountIdInOrderByCreatedAtDesc(
                            userAccountIds, pageable
                    );
        }

        return payments.map(this::mapToRecurringPaymentResponse);
    }

    /**
     * Get saved billers
     */
    public Page<SavedBillerResponse> getSavedBillers(String category, Pageable pageable) {
        User user = getCurrentUser();

        Page<SavedBiller> billers;
        
        if (category != null) {
            billers = savedBillerRepository
                    .findByUserIdAndCategoryOrderByCreatedAtDesc(user.getId(), category, pageable);
        } else {
            billers = savedBillerRepository
                    .findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        }

        return billers.map(this::mapToSavedBillerResponse);
    }

    /**
     * Save biller
     */
    @Transactional
    public SavedBillerResponse saveBiller(@Valid SaveBillerRequest request) {
        User user = getCurrentUser();

        // Check if biller already exists
        if (savedBillerRepository.existsByUserIdAndBillerNameAndAccountNumber(
                user.getId(), request.billerName(), request.accountNumber())) {
            throw new IllegalArgumentException("Biller already saved");
        }

        SavedBiller biller = new SavedBiller(
                user.getId(),
                request.billerName(),
                request.category(),
                request.accountNumber(),
                request.nickname()
        );
        savedBillerRepository.save(biller);

        // Log activity
        logActivity(user, "BILLER_SAVED", 
                "Saved biller: " + request.billerName());

        return mapToSavedBillerResponse(biller);
    }

    /**
     * Delete biller
     */
    @Transactional
    public void deleteBiller(@NotNull Long billerId) {
        User user = getCurrentUser();

        SavedBiller biller = savedBillerRepository.findById(billerId)
                .orElseThrow(() -> new IllegalArgumentException("Biller not found"));

        if (!biller.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        savedBillerRepository.delete(biller);

        // Log activity
        logActivity(user, "BILLER_DELETED", 
                "Deleted biller: " + biller.getBillerName());
    }

    /**
     * Cancel payment
     */
    @Transactional
    public void cancelPayment(@NotNull Long paymentId) {
        User user = getCurrentUser();

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        // Verify ownership
        verifyPaymentOwnership(user, payment);

        // Check if can be cancelled
        if (!payment.getStatus().equals("PENDING") && !payment.getStatus().equals("SCHEDULED")) {
            throw new IllegalArgumentException("Only pending or scheduled payments can be cancelled");
        }

        // Update status
        payment.setStatus("CANCELLED");
        paymentRepository.save(payment);

        // Send notification
        createNotification(
                user.getId(),
                "Payment Cancelled",
                "Payment " + payment.getReference() + " has been cancelled.",
                "INFO"
        );

        // Log activity
        logActivity(user, "PAYMENT_CANCELLED", 
                "Cancelled payment: " + payment.getReference());
    }

    /**
     * Cancel recurring payment
     */
    @Transactional
    public void cancelRecurringPayment(@NotNull Long recurringPaymentId) {
        User user = getCurrentUser();

        RecurringPayment recurringPayment = recurringPaymentRepository.findById(recurringPaymentId)
                .orElseThrow(() -> new IllegalArgumentException("Recurring payment not found"));

        // Verify ownership
        Account account = accountRepository.findById(recurringPayment.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        
        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Deactivate
        recurringPayment.setActive(false);
        recurringPaymentRepository.save(recurringPayment);

        // Send notification
        createNotification(
                user.getId(),
                "Recurring Payment Cancelled",
                "Recurring payment has been cancelled.",
                "INFO"
        );

        // Log activity
        logActivity(user, "RECURRING_PAYMENT_CANCELLED", 
                String.format("Cancelled %s recurring payment of %.2f %s", 
                        recurringPayment.getFrequency(), recurringPayment.getAmount(), 
                        recurringPayment.getCurrency()));
    }

    /**
     * Get payment receipt
     */
    public PaymentReceiptResponse getPaymentReceipt(@NotNull Long paymentId) {
        User user = getCurrentUser();

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        // Verify ownership
        verifyPaymentOwnership(user, payment);

        Account account = accountRepository.findById(payment.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        return new PaymentReceiptResponse(
                payment.getId(),
                payment.getReference(),
                payment.getPaymentType(),
                payment.getCategory(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getPayeeName(),
                payment.getPayeeAccount(),
                payment.getDescription(),
                payment.getStatus(),
                account.getAccountNumber(),
                payment.getCreatedAt()
        );
    }

    /**
     * Get payment statistics
     */
    public PaymentStatisticsResponse getPaymentStatistics(LocalDate startDate, LocalDate endDate) {
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
            return new PaymentStatisticsResponse(0, 0, 0, 0, BigDecimal.ZERO, 0, 0);
        }

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        List<Payment> payments = paymentRepository
                .findByAccountIdInAndCreatedAtBetween(userAccountIds, start, end);

        int totalPayments = payments.size();
        
        BigDecimal totalAmount = payments.stream()
                .filter(p -> p.getStatus().equals("COMPLETED"))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long billPayments = payments.stream()
                .filter(p -> p.getPaymentType().equals("BILL"))
                .count();

        long utilityPayments = payments.stream()
                .filter(p -> p.getPaymentType().equals("UTILITY"))
                .count();

        long merchantPayments = payments.stream()
                .filter(p -> p.getPaymentType().equals("MERCHANT"))
                .count();

        long completedCount = payments.stream()
                .filter(p -> p.getStatus().equals("COMPLETED"))
                .count();

        long pendingCount = payments.stream()
                .filter(p -> p.getStatus().equals("PENDING"))
                .count();

        return new PaymentStatisticsResponse(
                totalPayments,
                (int) billPayments,
                (int) utilityPayments,
                (int) merchantPayments,
                totalAmount,
                (int) completedCount,
                (int) pendingCount
        );
    }

    /**
     * Get payment categories
     */
    public PaymentCategoriesResponse getPaymentCategories() {
        return new PaymentCategoriesResponse(
                PAYMENT_CATEGORIES,
                PAYMENT_TYPES
        );
    }

    // ==================== Helper Methods ====================

    /**
     * Generate unique payment reference
     */
    private String generatePaymentReference() {
        return "PAY" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    /**
     * Validate payment
     */
    private void validatePayment(Account account, BigDecimal amount) {
        // Check account is active
        if (!account.getStatus().equals("ACTIVE")) {
            throw new IllegalArgumentException("Account is not active");
        }

        // Check sufficient balance
        if (account.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient balance");
        }

        // Check minimum amount
        if (amount.compareTo(new BigDecimal("0.01")) < 0) {
            throw new IllegalArgumentException("Amount must be greater than 0.01");
        }
    }

    /**
     * Process payment
     */
    private void processPayment(Payment payment, Account account) {
        // Deduct from account
        BigDecimal oldBalance = account.getBalance();
        BigDecimal newBalance = oldBalance.subtract(payment.getAmount());
        account.setBalance(newBalance);
        account.setUpdatedAt(LocalDateTime.now());
        accountRepository.save(account);

        // Create balance history
        createBalanceHistory(account, oldBalance, newBalance, 
                "PAYMENT", "Payment to " + payment.getPayeeName());

        // Create transaction
        createTransaction(account.getId(), "PAYMENT", payment.getAmount(), 
                account.getCurrency(), payment.getReference(), payment.getDescription());

        // Send notification
        createNotification(
                account.getUserId(),
                "Payment Successful",
                String.format("Payment of %.2f %s to %s completed successfully", 
                        payment.getAmount(), account.getCurrency(), payment.getPayeeName()),
                "SUCCESS"
        );
    }

    /**
     * Verify payment ownership
     */
    private void verifyPaymentOwnership(User user, Payment payment) {
        Account account = accountRepository.findById(payment.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        
        if (!account.getUserId().equals(user.getId())) {
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
     * Map Payment to PaymentResponse
     */
    private PaymentResponse mapToPaymentResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getAccountId(),
                payment.getPaymentType(),
                payment.getCategory(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getReference(),
                payment.getPayeeName(),
                payment.getPayeeAccount(),
                payment.getDescription(),
                payment.getStatus(),
                payment.getScheduledDate(),
                payment.getCreatedAt()
        );
    }

    /**
     * Map RecurringPayment to RecurringPaymentResponse
     */
    private RecurringPaymentResponse mapToRecurringPaymentResponse(RecurringPayment payment) {
        return new RecurringPaymentResponse(
                payment.getId(),
                payment.getAccountId(),
                payment.getPaymentType(),
                payment.getCategory(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getFrequency(),
                payment.getStartDate(),
                payment.getEndDate(),
                payment.getNextExecutionDate(),
                payment.getPayeeName(),
                payment.getPayeeAccount(),
                payment.getDescription(),
                payment.isActive(),
                payment.getCreatedAt()
        );
    }

    /**
     * Map SavedBiller to SavedBillerResponse
     */
    private SavedBillerResponse mapToSavedBillerResponse(SavedBiller biller) {
        return new SavedBillerResponse(
                biller.getId(),
                biller.getBillerName(),
                biller.getCategory(),
                biller.getAccountNumber(),
                biller.getNickname(),
                biller.getCreatedAt()
        );
    }
}
