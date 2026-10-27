package com.janseva.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Reads the Bearer token, validates it, and - if valid - places a lightweight
 * Authentication (principal = subject id, authority = ROLE_<role>) in the
 * SecurityContext. Controllers use @PreAuthorize("hasRole('ADMINISTRATOR')")
 * etc. to guard endpoints, and read the authenticated id via
 * SecurityContextHolder to look up the current Citizen/Officer.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                // Blacklisted tokens (from logout / forced password change) are
                // rejected even if their signature/expiry would otherwise be valid.
                if (jwtUtil.isTokenValid(token) && !tokenBlacklistService.isBlacklisted(token)) {
                    String subject = jwtUtil.extractSubject(token);
                    String role = jwtUtil.extractRole(token);

                    var authToken = new UsernamePasswordAuthenticationToken(
                            subject, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (Exception ignored) {
                // invalid/expired token -> request proceeds unauthenticated
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}