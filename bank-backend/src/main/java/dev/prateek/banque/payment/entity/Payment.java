package dev.prateek.banque.payment.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "payment_type", nullable = false, length = 20)
    private String paymentType; // BILL, UTILITY, MERCHANT, SCHEDULED

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Column(nullable = false, unique = true, length = 20)
    private String reference;

    @Column(name = "payee_name", nullable = false, length = 100)
    private String payeeName;

    @Column(name = "payee_account", length = 100)
    private String payeeAccount;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, COMPLETED, FAILED, CANCELLED, SCHEDULED

    @Column(name = "scheduled_date")
    private LocalDateTime scheduledDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Payment(Long accountId, String paymentType, String category, BigDecimal amount,
                  String currency, String reference, String payeeName, String payeeAccount,
                  String description) {
        this.accountId = accountId;
        this.paymentType = paymentType;
        this.category = category;
        this.amount = amount;
        this.currency = currency;
        this.reference = reference;
        this.payeeName = payeeName;
        this.payeeAccount = payeeAccount;
        this.description = description;
        this.createdAt = LocalDateTime.now();
    }

    public Payment() {

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

    public String getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getPayeeName() {
        return payeeName;
    }

    public void setPayeeName(String payeeName) {
        this.payeeName = payeeName;
    }

    public String getPayeeAccount() {
        return payeeAccount;
    }

    public void setPayeeAccount(String payeeAccount) {
        this.payeeAccount = payeeAccount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(LocalDateTime scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "Payment{" +
                "id=" + id +
                ", accountId=" + accountId +
                ", paymentType='" + paymentType + '\'' +
                ", category='" + category + '\'' +
                ", amount=" + amount +
                ", currency='" + currency + '\'' +
                ", reference='" + reference + '\'' +
                ", payeeName='" + payeeName + '\'' +
                ", payeeAccount='" + payeeAccount + '\'' +
                ", description='" + description + '\'' +
                ", status='" + status + '\'' +
                ", scheduledDate=" + scheduledDate +
                ", createdAt=" + createdAt +
                '}';
    }
}


