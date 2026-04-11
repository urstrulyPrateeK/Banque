package com.bank.bankbackend.common.exception;

/**
 * Thrown when a requested resource is not found.
 * Example: User, Account, Transaction not found.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
