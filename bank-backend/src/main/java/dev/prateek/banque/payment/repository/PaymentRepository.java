package dev.prateek.banque.payment.repository;

import dev.prateek.banque.payment.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository
        extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {

    Page<Payment> findByAccountIdInAndStatusOrderByCreatedAtDesc(
            List<Long> accountIds,
            String status,
            Pageable pageable
    );

    Page<Payment> findByAccountIdInAndStatusOrderByScheduledDateAsc(
            List<Long> accountIds,
            String status,
            Pageable pageable
    );

    List<Payment> findByAccountIdInAndCreatedAtBetween(
            List<Long> accountIds,
            LocalDateTime start,
            LocalDateTime end
    );

    boolean existsByReference(String reference);
}

