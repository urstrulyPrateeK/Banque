package dev.prateek.banque.account.repository;

import dev.prateek.banque.account.entity.BalanceHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BalanceHistoryRepository extends JpaRepository<BalanceHistory, Long> {
    
    // Find by account and date range
    Page<BalanceHistory> findByAccountIdAndRecordedAtBetweenOrderByRecordedAtDesc(
            Long accountId, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable
    );
    
    List<BalanceHistory> findByAccountIdAndRecordedAtBetweenOrderByRecordedAtDesc(
            Long accountId, LocalDateTime startDate, LocalDateTime endDate
    );
    
    // Find recent history
    List<BalanceHistory> findByAccountIdAndRecordedAtAfter(Long accountId, LocalDateTime date);
    
    // Find opening balance
    Optional<BalanceHistory> findFirstByAccountIdAndRecordedAtBeforeOrderByRecordedAtDesc(
            Long accountId, LocalDateTime date
    );
}
