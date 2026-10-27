package com.janseva.backend.exception;

/**
 * Thrown when a phone/mobile number is not exactly 10 consecutive digits.
 * HTTP Status: 400 Bad Request.
 */
public class InvalidPhoneException extends RuntimeException {
    public InvalidPhoneException(String message) {
        super(message);
    }
}