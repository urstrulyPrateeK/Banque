package com.bank.bankbackend.card.repository;

import com.bank.bankbackend.card.entity.CardTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CardTransactionRepository extends JpaRepository<CardTransaction, Long> {
    
    Page<CardTransaction> findByCardIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long cardId, LocalDateTime start, LocalDateTime end, Pageable pageable
    );
    
    List<CardTransaction> findByCardIdAndCreatedAtBetween(
            Long cardId, LocalDateTime start, LocalDateTime end
    );
}
