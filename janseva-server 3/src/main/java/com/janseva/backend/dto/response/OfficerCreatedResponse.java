package com.janseva.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficerCreatedResponse {
    private UUID officerId;
    private String employeeId;
    private String temporaryPassword;
    private String name;
    private String role;
    private String emailPreview;
    private String smsPreview;
}
