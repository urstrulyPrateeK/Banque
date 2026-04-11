package com.bank.bankbackend.payment.repository;

import com.bank.bankbackend.payment.entity.SavedBiller;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SavedBillerRepository extends JpaRepository<SavedBiller, Long> {

    Page<SavedBiller> findByUserIdOrderByCreatedAtDesc(
            Long userId,
            Pageable pageable
    );

    Page<SavedBiller> findByUserIdAndCategoryOrderByCreatedAtDesc(
            Long userId,
            String category,
            Pageable pageable
    );

    boolean existsByUserIdAndBillerNameAndAccountNumber(
            Long userId,
            String billerName,
            String accountNumber
    );
}
