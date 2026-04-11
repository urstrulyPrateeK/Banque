// Banque - by Prateek Singh | github.com/prateeksingh
package dev.prateek.banque.feedback.service;

import dev.prateek.banque.account.entity.Account;
import dev.prateek.banque.account.repository.AccountRepository;
import dev.prateek.banque.feedback.dto.FeedbackRequest;
import dev.prateek.banque.feedback.entity.TransactionFeedback;
import dev.prateek.banque.feedback.repository.TransactionFeedbackRepository;
import dev.prateek.banque.security.userdetails.UserDetailsImpl;
import dev.prateek.banque.transaction.entity.Transaction;
import dev.prateek.banque.transaction.repository.TransactionRepository;
import dev.prateek.banque.user.entity.User;
import dev.prateek.banque.user.dto.MessageResponse;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class FeedbackService {

    private final TransactionFeedbackRepository transactionFeedbackRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    public FeedbackService(
            TransactionFeedbackRepository transactionFeedbackRepository,
            TransactionRepository transactionRepository,
            AccountRepository accountRepository
    ) {
        this.transactionFeedbackRepository = transactionFeedbackRepository;
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public MessageResponse saveFeedback(FeedbackRequest request) {
        User user = getCurrentUser();
        Transaction transaction = transactionRepository.findById(request.transactionId())
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
        Account account = accountRepository.findById(transaction.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!account.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        TransactionFeedback feedback = transactionFeedbackRepository
                .findByUserIdAndTransactionId(user.getId(), request.transactionId())
                .orElseGet(() -> new TransactionFeedback(
                        user.getId(),
                        request.transactionId(),
                        request.positive(),
                        request.comment()
                ));

        feedback.setPositive(request.positive());
        feedback.setComment(request.comment());
        transactionFeedbackRepository.save(feedback);

        return new MessageResponse("Feedback saved successfully");
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl userDetails)) {
            throw new IllegalStateException("User not authenticated");
        }
        return userDetails.getUser();
    }
}
