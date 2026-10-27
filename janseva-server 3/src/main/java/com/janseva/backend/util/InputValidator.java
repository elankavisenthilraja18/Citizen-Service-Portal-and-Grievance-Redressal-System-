package com.janseva.backend.util;

import com.janseva.backend.exception.InvalidNameException;
import com.janseva.backend.exception.InvalidPhoneException;

import java.util.regex.Pattern;

/**
 * Central place for the field-validation rules from the SRS
 * (Appendix C - Validation Rules Summary). Bean Validation annotations on
 * the request DTOs give the user a fast, generic 400 for obviously malformed
 * input; these methods are called explicitly from the service layer so the
 * exact SRS-named exceptions (InvalidNameException / InvalidPhoneException)
 * are actually raised and can be asserted on in tests, not just swallowed
 * into a generic "validation failed" response.
 */
public final class InputValidator {

    // Alphabetic characters and spaces only, 2-100 characters (SRS Appendix C).
    private static final Pattern NAME_PATTERN = Pattern.compile("^[A-Za-z ]{2,100}$");

    // Exactly 10 consecutive numeric digits (SRS Appendix C / FR14).
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\d{10}$");

    // Minimum 8 characters, at least one uppercase, one lowercase, one digit,
    // and one special character (SRS Appendix D - Password Policy).
    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$");

    private InputValidator() {
    }

    public static void validateName(String name) {
        if (name == null || !NAME_PATTERN.matcher(name.trim()).matches()) {
            throw new InvalidNameException("Name must not contain numbers or special characters");
        }
    }

    public static void validatePhone(String phone) {
        if (phone == null || !PHONE_PATTERN.matcher(phone.trim()).matches()) {
            throw new InvalidPhoneException("Phone Number must be exactly 10 digits long");
        }
    }

    /** @return true if the password meets the SRS complexity policy. */
    public static boolean isStrongPassword(String password) {
        return password != null && PASSWORD_PATTERN.matcher(password).matches();
    }
}