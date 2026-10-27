package com.janseva.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record SubmitGrievanceRequest(
        @NotNull(message = "Category is required")
        UUID categoryId,

        @NotBlank(message = "Title is required")
        String title,

        @NotBlank(message = "Description is required")
        String description,

        String area,
        String ward,
        BigDecimal geoLat,
        BigDecimal geoLng,

        @NotBlank(message = "A geo-tagged photo is required as proof of the issue")
        String photoUrl
) {
}
