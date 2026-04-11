package com.bank.bankbackend.transfer.repository;

import com.bank.bankbackend.transfer.entity.Transfer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransferRepository extends JpaRepository<Transfer, Long>, JpaSpecificationExecutor<Transfer> {
    
    // Find by account and status
    Page<Transfer> findByFromAccountIdInAndStatusOrderByCreatedAtDesc(
            List<Long> accountIds, String status, Pageable pageable
    );
    
    Page<Transfer> findByFromAccountIdInAndStatusOrderByScheduledDateAsc(
            List<Long> accountIds, String status, Pageable pageable
    );
    
    // Find by date range
    List<Transfer> findByFromAccountIdInAndCreatedAtBetween(
            List<Long> accountIds, LocalDateTime startDate, LocalDateTime endDate
    );
    
    // Check existence
    boolean existsByReference(String reference);
}