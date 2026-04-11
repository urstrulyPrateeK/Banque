package dev.prateek.banque.common.exception;

/**
 * Thrown when an unauthorized action is attempted.
 * Example: Accessing another user's account.
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}

