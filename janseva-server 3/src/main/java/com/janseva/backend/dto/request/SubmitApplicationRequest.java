package com.janseva.backend.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record SubmitApplicationRequest(
        @NotNull(message = "Service is required")
        UUID serviceId,

        String purpose,
        String address,

        /** Document type -> uploaded file (base64 data URL), e.g. {"Aadhaar Card": "data:image/jpeg;base64,..."} */
        List<DocumentEntry> documents,

        /** Citizen must tick "I hereby declare that the information provided by me is true." */
        @AssertTrue(message = "You must declare that the information provided is true")
        boolean declarationAccepted
) {
    public record DocumentEntry(String documentType, String fileUrl) {}
}
