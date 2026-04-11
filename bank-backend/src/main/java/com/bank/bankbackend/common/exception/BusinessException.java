package com.bank.bankbackend.common.exception;

/**
 * Generic exception for business rule violations.
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
