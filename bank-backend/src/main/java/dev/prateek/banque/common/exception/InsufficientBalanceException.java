package dev.prateek.banque.common.exception;

/**
 * Thrown when an account does not have sufficient balance
 * for a transaction.
 */
public class InsufficientBalanceException extends RuntimeException {

    public InsufficientBalanceException(String message) {
        super(message);
    }
}

