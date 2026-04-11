package dev.prateek.banque;

import dev.prateek.banque.account.entity.Account;
import dev.prateek.banque.account.repository.AccountRepository;
import dev.prateek.banque.transaction.dto.WithdrawRequest;
import dev.prateek.banque.transaction.service.TransactionService;
import dev.prateek.banque.user.entity.User;
import dev.prateek.banque.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import dev.prateek.banque.security.userdetails.UserDetailsImpl;

import java.math.BigDecimal;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
public class ConcurrencyTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testConcurrentWithdrawals() throws InterruptedException {
        // 1. Setup: Create a user and an account with $1000
        User user = new User("testuser", "test@example.com", "password");
        user = userRepository.save(user);

        Account account = new Account("ACC123456", user.getId(), "SAVINGS", "USD");
        account.setBalance(new BigDecimal("1000.00"));
        account.setStatus("ACTIVE");
        account = accountRepository.save(account);

        // Mock Security Context
        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())
        );
        SecurityContextHolder.setContext(securityContext);

        // 2. Prepare for concurrency: 50 threads trying to withdraw $50 each
        int numberOfThreads = 50;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        BigDecimal withdrawAmount = new BigDecimal("50.00");

        // 3. Execute concurrent requests
        for (int i = 0; i < numberOfThreads; i++) {
            Long accountId = account.getId();
            executorService.submit(() -> {
                try {
                    // Propagate Security Context to this thread
                    SecurityContextHolder.setContext(securityContext);

                    // Each thread tries to withdraw $50
                    transactionService.withdraw(new WithdrawRequest(accountId, withdrawAmount, "Concurrent Test"));
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    // Print exception for debugging
                    System.err.println("Transaction failed: " + e.getMessage());
                    e.printStackTrace();
                    failCount.incrementAndGet();
                } finally {
                    SecurityContextHolder.clearContext(); // Clean up
                    latch.countDown();
                }
            });
        }

        latch.await(); // Wait for all threads to finish

        // 4. Verify results
        // Initial Balance: 1000
        // Total Attempted Withdrawal: 50 * 50 = 2500 (Should be impossible)
        // Max Possible Successful Withdrawals: 1000 / 50 = 20

        Account updatedAccount = accountRepository.findById(account.getId()).orElseThrow();
        System.out.println("Final Balance: " + updatedAccount.getBalance());
        System.out.println("Successful Transactions: " + successCount.get());
        System.out.println("Failed Transactions: " + failCount.get());

        // Assertions
        // Only 20 transactions should succeed (20 * 50 = 1000)
        assertEquals(20, successCount.get());
        // 30 transactions should fail due to insufficient funds
        assertEquals(30, failCount.get());
        // Final balance should be 0.00
        assertEquals(0, updatedAccount.getBalance().compareTo(BigDecimal.ZERO));
    }
}

