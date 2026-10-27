package com.janseva.backend.exception;

/**
 * Thrown when an authenticated user accesses a resource outside their
 * assigned role or ownership scope (as opposed to {@link UnauthorizedException},
 * which covers "not authenticated / bad credentials").
 * HTTP Status: 403 Forbidden.
 */
public class UnauthorisedAccessException extends RuntimeException {
    public UnauthorisedAccessException(String message) {
        super(message);
    }
}