package com.bank.bankbackend.card.service;

import com.bank.bankbackend.account.entity.Account;
import com.bank.bankbackend.account.entity.BalanceHistory;
import com.bank.bankbackend.account.repository.AccountRepository;
import com.bank.bankbackend.account.repository.BalanceHistoryRepository;
import com.bank.bankbackend.card.dto.*;
import com.bank.bankbackend.card.entity.Card;
import com.bank.bankbackend.card.entity.CardTransaction;
import com.bank.bankbackend.card.repository.CardRepository;
import com.bank.bankbackend.card.repository.CardTransactionRepository;
import com.bank.bankbackend.security.userdetails.UserDetailsImpl;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Random;

@Service
public class CardService {

    private static final Logger logger = LoggerFactory.getLogger(CardService.class);

    private final CardRepository cardRepository;
    private final CardTransactionRepository cardTransactionRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final BalanceHistoryRepository balanceHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final UserActivityRepository userActivityRepository;
    private final PasswordEncoder passwordEncoder;

    // Card configuration
    private static final Random random = new Random();
    private static final BigDecimal DEFAULT_DAILY_LIMIT = new BigDecimal("5000.00");
    private static final BigDecimal DEFAULT_MONTHLY_LIMIT = new BigDecimal("50000.00");
    private static final BigDecimal DEFAULT_ATM_LIMIT = new BigDecimal("2000.00");
    private static final BigDecimal DEFAULT_POS_LIMIT = new BigDecimal("10000.00");

    // Card types
    private static final List<String> CARD_TYPES = Arrays.asList("DEBIT", "CREDIT", "PREPAID");

    public CardService(
            CardRepository cardRepository,
            CardTransactionRepository cardTransactionRepository,
            AccountRepository accountRepository,
            TransactionRepository transactionRepository,
            BalanceHistoryRepository balanceHistoryRepository,
            NotificationRepository notificationRepository,
            UserActivityRepository userActivityRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.cardRepository = cardRepository;
        this.cardTransactionRepository = cardTransactionRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.balanceHistoryRepository = balanceHistoryRepository;
        this.notificationRepository = notificationRepository;
        this.userActivityRepository = userActivityRepository;
        this.passwordEncoder = passwordEncoder;
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
     * Request new card
     */
    @Transactional
    public CardResponse requestCard(@Valid CardRequestRequest request) {
        User user = getCurrentUser();

        // Get and verify account
        Account account = accountRepository.findById(request.accountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        // Check if account is active
        if (!account.getStatus().equals("ACTIVE")) {
            throw new IllegalArgumentException("Account must be active to request a card");
        }

        // Generate card details
        String cardNumber = generateCardNumber();
        String cvv = generateCVV();
        YearMonth expiryDate = YearMonth.now().plusYears(3);

        // Create card
        Card card = new Card(
                account.getId(),
                request.cardType(),
                cardNumber,
                cvv,
                expiryDate
        );
        card.setCardholderName(user.getFirstName() + " " + user.getLastName());
        card.setStatus("PENDING");
        
        // Set default limits
        card.setDailyLimit(DEFAULT_DAILY_LIMIT);
        card.setMonthlyLimit(DEFAULT_MONTHLY_LIMIT);
        card.setAtmLimit(DEFAULT_ATM_LIMIT);
        card.setPosLimit(DEFAULT_POS_LIMIT);
        
        cardRepository.save(card);

        // Send notification
        createNotification(
                user.getId(),
                "Card Requested",
                String.format("%s card requested successfully. You will receive it within 7-10 business days.",
                        request.cardType()),
                "SUCCESS"
        );

        // Log activity
        logActivity(user, "CARD_REQUESTED",
                String.format("Requested %s card for account %s",
                        request.cardType(), account.getAccountNumber()));

        return mapToCardResponse(card);
    }

    /**
     * Get cards with filters
     */
    public Page<CardResponse> getCards(Long accountId, String type, String status, Pageable pageable) {
        logger.info("Fetching cards with filters: accountId={}, type={}, status={}", accountId, type, status);
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
            logger.debug("Building specification for card query.");
            Specification<Card> spec = Specification.where((root, query, cb) -> root.get("accountId").in(userAccountIds));

            // Apply filters
            if (accountId != null) {
                logger.debug("Applying accountId filter: {}", accountId);
                spec = spec.and((root, query, cb) -> cb.equal(root.get("accountId"), accountId));
            }
            if (type != null) {
                logger.debug("Applying type filter: {}", type);
                spec = spec.and((root, query, cb) -> cb.equal(root.get("cardType"), type));
            }
            if (status != null) {
                logger.debug("Applying status filter: {}", status);
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
            }

            logger.info("Executing findAll cards query.");
            Page<Card> cards = cardRepository.findAll(spec, pageable);
            logger.info("Found {} cards.", cards.getTotalElements());

            return cards.map(this::mapToCardResponse);
        } catch (Exception e) {
            logger.error("Error fetching cards: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get card by ID
     */
    public CardResponse getCardById(@NotNull Long cardId) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        return mapToCardResponse(card);
    }

    /**
     * Activate card
     */
    @Transactional
    public void activateCard(@NotNull Long cardId, @Valid ActivateCardRequest request) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        // Check if card is pending
        if (!card.getStatus().equals("PENDING")) {
            throw new IllegalArgumentException("Only pending cards can be activated");
        }

        // Verify CVV
        if (!card.getCvv().equals(request.cvv())) {
            throw new IllegalArgumentException("Invalid CVV");
        }

        // Set PIN
        card.setPin(passwordEncoder.encode(request.pin()));
        card.setStatus("ACTIVE");
        cardRepository.save(card);

        // Send notification
        createNotification(
                user.getId(),
                "Card Activated",
                String.format("Your %s card ending in %s has been activated.",
                        card.getCardType(), card.getCardNumber().substring(12)),
                "SUCCESS"
        );

        // Log activity
        logActivity(user, "CARD_ACTIVATED",
                String.format("Activated %s card ending in %s",
                        card.getCardType(), card.getCardNumber().substring(12)));
    }

    /**
     * Block card
     */
    @Transactional
    public void blockCard(@NotNull Long cardId, @NotBlank String reason) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        if (card.getStatus().equals("BLOCKED")) {
            throw new IllegalArgumentException("Card is already blocked");
        }

        if (card.getStatus().equals("CANCELLED")) {
            throw new IllegalArgumentException("Cannot block a cancelled card");
        }

        card.setStatus("BLOCKED");
        cardRepository.save(card);

        // Send notification
        createNotification(
                user.getId(),
                "Card Blocked",
                String.format("Your card ending in %s has been blocked. Reason: %s",
                        card.getCardNumber().substring(12), reason),
                "WARNING"
        );

        // Log activity
        logActivity(user, "CARD_BLOCKED",
                String.format("Blocked card ending in %s - Reason: %s",
                        card.getCardNumber().substring(12), reason));
    }

    /**
     * Unblock card
     */
    @Transactional
    public void unblockCard(@NotNull Long cardId) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        if (!card.getStatus().equals("BLOCKED")) {
            throw new IllegalArgumentException("Only blocked cards can be unblocked");
        }

        card.setStatus("ACTIVE");
        cardRepository.save(card);

        // Send notification
        createNotification(
                user.getId(),
                "Card Unblocked",
                String.format("Your card ending in %s has been unblocked and is now active.",
                        card.getCardNumber().substring(12)),
                "SUCCESS"
        );

        // Log activity
        logActivity(user, "CARD_UNBLOCKED",
                String.format("Unblocked card ending in %s", card.getCardNumber().substring(12)));
    }

    /**
     * Report card lost/stolen
     */
    @Transactional
    public void reportLost(@NotNull Long cardId) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        if (card.getStatus().equals("CANCELLED")) {
            throw new IllegalArgumentException("Card is already cancelled");
        }

        card.setStatus("LOST");
        cardRepository.save(card);

        // Send notification
        createNotification(
                user.getId(),
                "Card Reported Lost/Stolen",
                String.format("Your card ending in %s has been reported as lost/stolen and blocked. Please request a replacement card.",
                        card.getCardNumber().substring(12)),
                "WARNING"
        );

        // Log activity
        logActivity(user, "CARD_REPORTED_LOST",
                String.format("Reported card ending in %s as lost/stolen",
                        card.getCardNumber().substring(12)));
    }

    /**
     * Change PIN
     */
    @Transactional
    public void changePin(@NotNull Long cardId, @Valid ChangePinRequest request) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        // Check card is active
        if (!card.getStatus().equals("ACTIVE")) {
            throw new IllegalArgumentException("Only active cards can have PIN changed");
        }

        // Verify current PIN
        if (!passwordEncoder.matches(request.currentPin(), card.getPin())) {
            throw new IllegalArgumentException("Current PIN is incorrect");
        }

        // Verify new PIN confirmation
        if (!request.newPin().equals(request.confirmPin())) {
            throw new IllegalArgumentException("New PIN and confirmation do not match");
        }

        // Update PIN
        card.setPin(passwordEncoder.encode(request.newPin()));
        cardRepository.save(card);

        // Send notification
        createNotification(
                user.getId(),
                "Card PIN Changed",
                String.format("PIN for your card ending in %s has been changed successfully.",
                        card.getCardNumber().substring(12)),
                "SUCCESS"
        );

        // Log activity
        logActivity(user, "CARD_PIN_CHANGED",
                String.format("Changed PIN for card ending in %s", card.getCardNumber().substring(12)));
    }

    /**
     * Set card limits
     */
    @Transactional
    public CardLimitsResponse setCardLimits(@NotNull Long cardId, @Valid SetCardLimitsRequest request) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        // Update limits
        card.setDailyLimit(request.dailyLimit());
        card.setMonthlyLimit(request.monthlyLimit());
        card.setAtmLimit(request.atmLimit());
        card.setPosLimit(request.posLimit());
        cardRepository.save(card);

        // Send notification
        createNotification(
                user.getId(),
                "Card Limits Updated",
                String.format("Transaction limits for your card ending in %s have been updated.",
                        card.getCardNumber().substring(12)),
                "INFO"
        );

        // Log activity
        logActivity(user, "CARD_LIMITS_UPDATED",
                String.format("Updated limits for card ending in %s", card.getCardNumber().substring(12)));

        return new CardLimitsResponse(
                card.getDailyLimit(),
                card.getMonthlyLimit(),
                card.getAtmLimit(),
                card.getPosLimit()
        );
    }

    /**
     * Get card limits
     */
    public CardLimitsResponse getCardLimits(@NotNull Long cardId) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        return new CardLimitsResponse(
                card.getDailyLimit(),
                card.getMonthlyLimit(),
                card.getAtmLimit(),
                card.getPosLimit()
        );
    }

    /**
     * Get card transactions
     */
    public Page<CardTransactionResponse> getCardTransactions(
            @NotNull Long cardId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : LocalDateTime.now().minusMonths(1);
        LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : LocalDateTime.now();

        Page<CardTransaction> transactions = cardTransactionRepository
                .findByCardIdAndCreatedAtBetweenOrderByCreatedAtDesc(cardId, start, end, pageable);

        return transactions.map(this::mapToCardTransactionResponse);
    }

    /**
     * Get card statement
     */
    public CardStatementResponse getCardStatement(
            @NotNull Long cardId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        List<CardTransaction> transactions = cardTransactionRepository
                .findByCardIdAndCreatedAtBetween(cardId, start, end);

        BigDecimal totalSpent = transactions.stream()
                .map(CardTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int transactionCount = transactions.size();

        return new CardStatementResponse(
                card.getCardNumber().substring(12),
                card.getCardType(),
                startDate,
                endDate,
                totalSpent,
                transactionCount,
                card.getCurrency()
        );
    }

    /**
     * Replace card
     */
    @Transactional
    public CardResponse replaceCard(@NotNull Long cardId, @NotBlank String reason) {
        User user = getCurrentUser();

        Card oldCard = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, oldCard);

        // Cancel old card
        oldCard.setStatus("CANCELLED");
        cardRepository.save(oldCard);

        // Generate new card details
        String cardNumber = generateCardNumber();
        String cvv = generateCVV();
        YearMonth expiryDate = YearMonth.now().plusYears(3);

        // Create replacement card
        Card newCard = new Card(
                oldCard.getAccountId(),
                oldCard.getCardType(),
                cardNumber,
                cvv,
                expiryDate
        );
        newCard.setCardholderName(oldCard.getCardholderName());
        newCard.setStatus("PENDING");
        newCard.setDailyLimit(oldCard.getDailyLimit());
        newCard.setMonthlyLimit(oldCard.getMonthlyLimit());
        newCard.setAtmLimit(oldCard.getAtmLimit());
        newCard.setPosLimit(oldCard.getPosLimit());
        cardRepository.save(newCard);

        // Send notification
        createNotification(
                user.getId(),
                "Replacement Card Ordered",
                String.format("Replacement card ordered. Reason: %s. You will receive it within 7-10 business days.", reason),
                "INFO"
        );

        // Log activity
        logActivity(user, "CARD_REPLACED",
                String.format("Ordered replacement for card ending in %s - Reason: %s",
                        oldCard.getCardNumber().substring(12), reason));

        return mapToCardResponse(newCard);
    }

    /**
     * Cancel card
     */
    @Transactional
    public void cancelCard(@NotNull Long cardId) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        if (card.getStatus().equals("CANCELLED")) {
            throw new IllegalArgumentException("Card is already cancelled");
        }

        card.setStatus("CANCELLED");
        cardRepository.save(card);

        // Send notification
        createNotification(
                user.getId(),
                "Card Cancelled",
                String.format("Your card ending in %s has been cancelled.", card.getCardNumber().substring(12)),
                "INFO"
        );

        // Log activity
        logActivity(user, "CARD_CANCELLED",
                String.format("Cancelled card ending in %s", card.getCardNumber().substring(12)));
    }

    /**
     * Get card details (masked)
     */
    public CardDetailsResponse getCardDetails(@NotNull Long cardId) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        return new CardDetailsResponse(
                card.getId(),
                maskCardNumber(card.getCardNumber()),
                card.getCardholderName(),
                card.getExpiryDate().toString(),
                card.getCardType(),
                card.getStatus(),
                card.isOnlineTransactionsEnabled(),
                card.isContactlessEnabled(),
                card.isInternationalEnabled()
        );
    }

    /**
     * Toggle online transactions
     */
    @Transactional
    public void toggleOnlineTransactions(@NotNull Long cardId, boolean enabled) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        card.setOnlineTransactionsEnabled(enabled);
        cardRepository.save(card);

        // Log activity
        String action = enabled ? "enabled" : "disabled";
        logActivity(user, "CARD_ONLINE_" + (enabled ? "ENABLED" : "DISABLED"),
                String.format("Online transactions %s for card ending in %s",
                        action, card.getCardNumber().substring(12)));
    }

    /**
     * Toggle contactless payments
     */
    @Transactional
    public void toggleContactless(@NotNull Long cardId, boolean enabled) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        card.setContactlessEnabled(enabled);
        cardRepository.save(card);

        // Log activity
        String action = enabled ? "enabled" : "disabled";
        logActivity(user, "CARD_CONTACTLESS_" + (enabled ? "ENABLED" : "DISABLED"),
                String.format("Contactless payments %s for card ending in %s",
                        action, card.getCardNumber().substring(12)));
    }

    /**
     * Toggle international transactions
     */
    @Transactional
    public void toggleInternational(@NotNull Long cardId, boolean enabled) {
        User user = getCurrentUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // Verify ownership
        verifyCardOwnership(user, card);

        card.setInternationalEnabled(enabled);
        cardRepository.save(card);

        // Log activity
        String action = enabled ? "enabled" : "disabled";
        logActivity(user, "CARD_INTERNATIONAL_" + (enabled ? "ENABLED" : "DISABLED"),
                String.format("International transactions %s for card ending in %s",
                        action, card.getCardNumber().substring(12)));
    }

    /**
     * Get card statistics
     */
    public CardStatisticsResponse getCardStatistics(LocalDate startDate, LocalDate endDate) {
        User user = getCurrentUser();

        List<Long> userAccountIds = accountRepository.findByUserId(user.getId())
                .stream()
                .map(Account::getId)
                .toList();

        if (userAccountIds.isEmpty()) {
            return new CardStatisticsResponse(0, 0, 0, 0, 0);
        }

        List<Card> cards = cardRepository.findByAccountIdIn(userAccountIds);

        int totalCards = cards.size();
        long activeCards = cards.stream().filter(c -> c.getStatus().equals("ACTIVE")).count();
        long blockedCards = cards.stream().filter(c -> c.getStatus().equals("BLOCKED")).count();
        long debitCards = cards.stream().filter(c -> c.getCardType().equals("DEBIT")).count();
        long creditCards = cards.stream().filter(c -> c.getCardType().equals("CREDIT")).count();

        return new CardStatisticsResponse(
                totalCards,
                (int) activeCards,
                (int) blockedCards,
                (int) debitCards,
                (int) creditCards
        );
    }

    /**
     * Get card types
     */
    public CardTypesResponse getCardTypes() {
        return new CardTypesResponse(CARD_TYPES);
    }

    // ==================== Helper Methods ====================

    /**
     * Generate card number (16 digits)
     */
    private String generateCardNumber() {
        StringBuilder cardNumber = new StringBuilder("4");  // Visa prefix
        for (int i = 0; i < 15; i++) {
            cardNumber.append(random.nextInt(10));
        }
        return cardNumber.toString();
    }

    /**
     * Generate CVV (3 digits)
     */
    private String generateCVV() {
        return String.format("%03d", random.nextInt(1000));
    }

    /**
     * Mask card number (show last 4 digits)
     */
    private String maskCardNumber(String cardNumber) {
        return "**** **** **** " + cardNumber.substring(12);
    }

    /**
     * Verify card ownership
     */
    private void verifyCardOwnership(User user, Card card) {
        Account account = accountRepository.findById(card.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }
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
     * Map Card to CardResponse
     */
    private CardResponse mapToCardResponse(Card card) {
        return new CardResponse(
                card.getId(),
                card.getAccountId(),
                card.getCardType(),
                maskCardNumber(card.getCardNumber()),
                card.getCardholderName(),
                card.getExpiryDate().toString(),
                card.getStatus(),
                card.getCreatedAt()
        );
    }

    /**
     * Map CardTransaction to CardTransactionResponse
     */
    private CardTransactionResponse mapToCardTransactionResponse(CardTransaction transaction) {
        return new CardTransactionResponse(
                transaction.getId(),
                transaction.getMerchantName(),
                transaction.getTransactionType(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getStatus(),
                transaction.getCreatedAt()
        );
    }
}