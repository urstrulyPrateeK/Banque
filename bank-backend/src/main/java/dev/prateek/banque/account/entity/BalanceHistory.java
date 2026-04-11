package dev.prateek.banque.account.entity;

import jakarta.persistence.*;


import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "balance_history")

public class BalanceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "old_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal oldBalance;

    @Column(name = "new_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal newBalance;

    @Column(name = "transaction_type", nullable = false, length = 50)
    private String transactionType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private LocalDateTime recordedAt;

    public BalanceHistory(Long accountId, BigDecimal oldBalance, BigDecimal newBalance, 
                         String transactionType, String description) {
        this.accountId = accountId;
        this.oldBalance = oldBalance;
        this.newBalance = newBalance;
        this.transactionType = transactionType;
        this.description = description;
        this.recordedAt = LocalDateTime.now();
    }

    public BalanceHistory() {

    }



    @PrePersist
    protected void onCreate() {
        recordedAt = LocalDateTime.now();
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

    public BigDecimal getOldBalance() {
        return oldBalance;
    }

    public void setOldBalance(BigDecimal oldBalance) {
        this.oldBalance = oldBalance;
    }

    public BigDecimal getNewBalance() {
        return newBalance;
    }

    public void setNewBalance(BigDecimal newBalance) {
        this.newBalance = newBalance;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }

    @Override
    public String toString() {
        return "BalanceHistory{" +
                "id=" + id +
                ", accountId=" + accountId +
                ", oldBalance=" + oldBalance +
                ", newBalance=" + newBalance +
                ", transactionType='" + transactionType + '\'' +
                ", description='" + description + '\'' +
                ", recordedAt=" + recordedAt +
                '}';
    }
}
