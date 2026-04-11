// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.feedback.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_feedback")
public class TransactionFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long transactionId;

    @Column(nullable = false)
    private boolean positive;

    @Column(length = 250)
    private String comment;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public TransactionFeedback() {
    }

    public TransactionFeedback(Long userId, Long transactionId, boolean positive, String comment) {
        this.userId = userId;
        this.transactionId = transactionId;
        this.positive = positive;
        this.comment = comment;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public boolean isPositive() {
        return positive;
    }

    public void setPositive(boolean positive) {
        this.positive = positive;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
