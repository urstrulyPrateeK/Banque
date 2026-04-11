package com.bank.bankbackend.payment.repository;

import com.bank.bankbackend.payment.entity.RecurringPayment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecurringPaymentRepository extends JpaRepository<RecurringPayment, Long> {

    Page<RecurringPayment> findByAccountIdInOrderByCreatedAtDesc(
            List<Long> accountIds,
            Pageable pageable
    );

    Page<RecurringPayment> findByAccountIdInAndIsActiveOrderByCreatedAtDesc(
            List<Long> accountIds,
            boolean isActive,
            Pageable pageable
    );
}
