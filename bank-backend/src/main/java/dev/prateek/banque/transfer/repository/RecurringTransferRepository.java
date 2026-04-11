package dev.prateek.banque.transfer.repository;

import dev.prateek.banque.transfer.entity.RecurringTransfer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecurringTransferRepository extends JpaRepository<RecurringTransfer, Long> {
    
    // Find by account
    Page<RecurringTransfer> findByFromAccountIdInOrderByCreatedAtDesc(
            List<Long> accountIds, Pageable pageable
    );
    
    // Find by account and active status
    Page<RecurringTransfer> findByFromAccountIdInAndIsActiveOrderByCreatedAtDesc(
            List<Long> accountIds, boolean isActive, Pageable pageable
    );
}
