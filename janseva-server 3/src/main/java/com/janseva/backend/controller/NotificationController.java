package com.janseva.backend.controller;

import com.janseva.backend.dto.response.ApiResponse;
import com.janseva.backend.enums.RecipientType;
import com.janseva.backend.model.Notification;
import com.janseva.backend.security.AuthContext;
import com.janseva.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthContext authContext;

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<Notification>>> mine() {
        String role = authContext.currentRole();
        RecipientType type = "CITIZEN".equals(role) ? RecipientType.CITIZEN : RecipientType.OFFICER;
        return ResponseEntity.ok(ApiResponse.ok(notificationService.listFor(type, authContext.currentUserId())));
    }
}
