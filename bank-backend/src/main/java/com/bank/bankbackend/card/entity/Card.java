package com.bank.bankbackend.card.entity;

import com.bank.bankbackend.common.converter.YearMonthDateAttributeConverter;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;

@Entity
@Table(name = "cards")
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "card_type", nullable = false, length = 20)
    private String cardType; // DEBIT, CREDIT, PREPAID

    @Column(name = "card_number", nullable = false, unique = true, length = 16)
    private String cardNumber;

    @Column(name = "cardholder_name", nullable = false, length = 100)
    private String cardholderName;

    @Column(nullable = false, length = 3)
    private String cvv;

    @Column(nullable = false, length = 4)
    private String pin;

    @Column(name = "expiry_date", nullable = false)
    @Convert(converter = YearMonthDateAttributeConverter.class)
    private YearMonth expiryDate;

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, ACTIVE, BLOCKED, LOST, CANCELLED

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Column(name = "daily_limit", precision = 19, scale = 2)
    private BigDecimal dailyLimit;

    @Column(name = "monthly_limit", precision = 19, scale = 2)
    private BigDecimal monthlyLimit;

    @Column(name = "atm_limit", precision = 19, scale = 2)
    private BigDecimal atmLimit;

    @Column(name = "pos_limit", precision = 19, scale = 2)
    private BigDecimal posLimit;

    @Column(name = "online_transactions_enabled")
    private boolean onlineTransactionsEnabled = true;

    @Column(name = "contactless_enabled")
    private boolean contactlessEnabled = true;

    @Column(name = "international_enabled")
    private boolean internationalEnabled = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Card(Long accountId, String cardType, String cardNumber, String cvv, YearMonth expiryDate) {
        this.accountId = accountId;
        this.cardType = cardType;
        this.cardNumber = cardNumber;
        this.cvv = cvv;
        this.expiryDate = expiryDate;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Card() {

    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    public String getCardType() {
        return cardType;
    }

    public void setCardType(String cardType) {
        this.cardType = cardType;
    }

    public String getCardNumber() {
        return cardNumber;
    }

    public void setCardNumber(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    public String getCardholderName() {
        return cardholderName;
    }

    public void setCardholderName(String cardholderName) {
        this.cardholderName = cardholderName;
    }

    public String getCvv() {
        return cvv;
    }

    public void setCvv(String cvv) {
        this.cvv = cvv;
    }

    public String getPin() {
        return pin;
    }

    public void setPin(String pin) {
        this.pin = pin;
    }

    public YearMonth getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(YearMonth expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getDailyLimit() {
        return dailyLimit;
    }

    public void setDailyLimit(BigDecimal dailyLimit) {
        this.dailyLimit = dailyLimit;
    }

    public BigDecimal getMonthlyLimit() {
        return monthlyLimit;
    }

    public void setMonthlyLimit(BigDecimal monthlyLimit) {
        this.monthlyLimit = monthlyLimit;
    }

    public BigDecimal getAtmLimit() {
        return atmLimit;
    }

    public void setAtmLimit(BigDecimal atmLimit) {
        this.atmLimit = atmLimit;
    }

    public BigDecimal getPosLimit() {
        return posLimit;
    }

    public void setPosLimit(BigDecimal posLimit) {
        this.posLimit = posLimit;
    }

    public boolean isOnlineTransactionsEnabled() {
        return onlineTransactionsEnabled;
    }

    public void setOnlineTransactionsEnabled(boolean onlineTransactionsEnabled) {
        this.onlineTransactionsEnabled = onlineTransactionsEnabled;
    }

    public boolean isContactlessEnabled() {
        return contactlessEnabled;
    }

    public void setContactlessEnabled(boolean contactlessEnabled) {
        this.contactlessEnabled = contactlessEnabled;
    }

    public boolean isInternationalEnabled() {
        return internationalEnabled;
    }

    public void setInternationalEnabled(boolean internationalEnabled) {
        this.internationalEnabled = internationalEnabled;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }


    @Override
    public String toString() {
        return "Card{" +
                "id=" + id +
                ", accountId=" + accountId +
                ", cardType='" + cardType + '\'' +
                ", cardNumber='" + cardNumber + '\'' +
                ", cardholderName='" + cardholderName + '\'' +
                ", cvv='" + cvv + '\'' +
                ", pin='" + pin + '\'' +
                ", expiryDate=" + expiryDate +
                ", status='" + status + '\'' +
                ", currency='" + currency + '\'' +
                ", dailyLimit=" + dailyLimit +
                ", monthlyLimit=" + monthlyLimit +
                ", atmLimit=" + atmLimit +
                ", posLimit=" + posLimit +
                ", onlineTransactionsEnabled=" + onlineTransactionsEnabled +
                ", contactlessEnabled=" + contactlessEnabled +
                ", internationalEnabled=" + internationalEnabled +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}