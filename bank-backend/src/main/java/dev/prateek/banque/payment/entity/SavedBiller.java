package dev.prateek.banque.payment.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "saved_billers")

public class SavedBiller {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "biller_name", nullable = false, length = 100)
    private String billerName;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "account_number", nullable = false, length = 100)
    private String accountNumber;

    @Column(length = 50)
    private String nickname;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public SavedBiller(Long userId, String billerName, String category, 
                      String accountNumber, String nickname) {
        this.userId = userId;
        this.billerName = billerName;
        this.category = category;
        this.accountNumber = accountNumber;
        this.nickname = nickname;
        this.createdAt = LocalDateTime.now();
    }

    public SavedBiller() {

    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getBillerName() {
        return billerName;
    }

    public void setBillerName(String billerName) {
        this.billerName = billerName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "SavedBiller{" +
                "id=" + id +
                ", userId=" + userId +
                ", billerName='" + billerName + '\'' +
                ", category='" + category + '\'' +
                ", accountNumber='" + accountNumber + '\'' +
                ", nickname='" + nickname + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
