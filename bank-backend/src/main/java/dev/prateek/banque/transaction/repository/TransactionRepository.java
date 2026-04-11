package dev.prateek.banque.transaction.repository;

import dev.prateek.banque.transaction.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {
    
    // Find by account
    Page<Transaction> findByAccountIdOrderByCreatedAtDesc(Long accountId, Pageable pageable);
    
    // Find by account and status
    Page<Transaction> findByAccountIdAndStatusOrderByCreatedAtDesc(Long accountId, String status, Pageable pageable);
    
    // Find by multiple accounts
    Page<Transaction> findByAccountIdInOrderByCreatedAtDesc(List<Long> accountIds, Pageable pageable);
    
    // Find by multiple accounts and status
    Page<Transaction> findByAccountIdInAndStatusOrderByCreatedAtDesc(List<Long> accountIds, String status, Pageable pageable);
    
    // Find by account and date range
    List<Transaction> findByAccountIdAndCreatedAtBetween(Long accountId, LocalDateTime startDate, LocalDateTime endDate);
    
    // Find by multiple accounts and date range
    List<Transaction> findByAccountIdInAndCreatedAtBetween(List<Long> accountIds, LocalDateTime startDate, LocalDateTime endDate);
    
    // Find by multiple accounts and date range with order
    List<Transaction> findByAccountIdInAndCreatedAtBetweenOrderByCreatedAtDesc(
            List<Long> accountIds, LocalDateTime startDate, LocalDateTime endDate
    );
    
    // Check existence
    boolean existsByReference(String reference);
}
