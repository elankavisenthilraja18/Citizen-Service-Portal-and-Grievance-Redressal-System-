package com.janseva.backend.exception;

/**
 * Thrown when a citizen tries to create a record (grievance or certificate
 * application) that duplicates one already in flight for the same citizen.
 * HTTP Status: 409 Conflict.
 */
public class DuplicateGrievanceException extends RuntimeException {
    public DuplicateGrievanceException(String message) {
        super(message);
    }
}