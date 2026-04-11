package dev.prateek.banque.card.repository;

import dev.prateek.banque.card.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CardRepository extends JpaRepository<Card, Long>, JpaSpecificationExecutor<Card> {
    List<Card> findByAccountIdIn(List<Long> accountIds);
    boolean existsByCardNumber(String cardNumber);
}

