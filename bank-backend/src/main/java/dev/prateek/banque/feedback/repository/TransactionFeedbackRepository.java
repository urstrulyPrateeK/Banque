// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.feedback.repository;

import dev.prateek.banque.feedback.entity.TransactionFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransactionFeedbackRepository extends JpaRepository<TransactionFeedback, Long> {

    Optional<TransactionFeedback> findByUserIdAndTransactionId(Long userId, Long transactionId);
}
