package com.financetracker.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "test-secret-key-that-is-long-enough-for-hs256-signing");
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 3600_000L);
    }

    @Test
    void generateToken_producesTokenThatExtractsSameUserIdAndEmail() {
        String token = jwtUtil.generateToken("user-123", "alice@example.com");

        assertThat(token).isNotBlank();
        assertThat(jwtUtil.extractUserId(token)).isEqualTo("user-123");

        Claims claims = jwtUtil.extractClaims(token);
        assertThat(claims.get("email")).isEqualTo("alice@example.com");
    }

    @Test
    void isValid_returnsTrueForFreshlyGeneratedToken() {
        String token = jwtUtil.generateToken("user-123", "alice@example.com");
        assertThat(jwtUtil.isValid(token)).isTrue();
    }

    @Test
    void isValid_returnsFalseForGarbageToken() {
        assertThat(jwtUtil.isValid("not-a-real-token")).isFalse();
    }

    @Test
    void isValid_returnsFalseForExpiredToken() {
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", -1000L);
        String token = jwtUtil.generateToken("user-123", "alice@example.com");
        assertThat(jwtUtil.isValid(token)).isFalse();
    }

    @Test
    void isValid_returnsFalseForTokenSignedWithDifferentSecret() {
        String token = jwtUtil.generateToken("user-123", "alice@example.com");

        JwtUtil otherJwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(otherJwtUtil, "secret", "a-completely-different-secret-key-value-here");
        ReflectionTestUtils.setField(otherJwtUtil, "expirationMs", 3600_000L);

        assertThat(otherJwtUtil.isValid(token)).isFalse();
    }
}
