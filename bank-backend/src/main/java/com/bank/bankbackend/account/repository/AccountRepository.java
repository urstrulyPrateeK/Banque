package com.bank.bankbackend.account.repository;

import com.bank.bankbackend.account.entity.Account;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    
    // Find by user
    List<Account> findByUserId(Long userId);
    Page<Account> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    // Find by user and filters
    Page<Account> findByUserIdAndAccountType(Long userId, String accountType, Pageable pageable);
    Page<Account> findByUserIdAndStatus(Long userId, String status, Pageable pageable);
    Page<Account> findByUserIdAndAccountTypeAndStatus(Long userId, String accountType, String status, Pageable pageable);
    
    // Check existence
    boolean existsByAccountNumber(String accountNumber);

    // Find by account number
    Optional<Account> findByAccountNumber(String accountNumber);

    // Find by ID with Pessimistic Lock
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.id = :id")
    Optional<Account> findByIdWithLock(Long id);
}