package com.financetracker.service;

import com.financetracker.dto.AuthResponse;
import com.financetracker.dto.LoginRequest;
import com.financetracker.dto.RegisterRequest;
import com.financetracker.dto.UserDto;
import com.financetracker.exception.ConflictException;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.model.Category;
import com.financetracker.model.User;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.UserRepository;
import com.financetracker.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_throwsConflictWhenEmailAlreadyExists() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(
                new RegisterRequest("Alice", "alice@example.com", "password123")))
                .isInstanceOf(ConflictException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_hashesPasswordSeedsDefaultCategoriesAndReturnsToken() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtUtil.generateToken(anyString(), eq("alice@example.com"))).thenReturn("jwt-token");

        AuthResponse response = authService.register(
                new RegisterRequest("Alice", "alice@example.com", "password123"));

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.user().email()).isEqualTo("alice@example.com");
        assertThat(response.user().name()).isEqualTo("Alice");

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUser.capture());
        assertThat(savedUser.getValue().getPasswordHash()).isEqualTo("hashed-password");

        ArgumentCaptor<List<Category>> savedCategories = ArgumentCaptor.forClass(List.class);
        verify(categoryRepository).saveAll(savedCategories.capture());
        assertThat(savedCategories.getValue()).hasSize(10);
        assertThat(savedCategories.getValue()).allMatch(Category::isDefaultCategory);
        assertThat(savedCategories.getValue()).extracting(Category::getName)
                .contains("Food & Dining", "Salary", "Other");
    }

    @Test
    void login_throwsBadCredentialsWhenEmailNotFound() {
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("nobody@example.com", "password")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_throwsBadCredentialsWhenPasswordDoesNotMatch() {
        User user = User.builder().id("u1").email("alice@example.com").passwordHash("hashed").build();
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("alice@example.com", "wrong-password")))
                .isInstanceOf(BadCredentialsException.class);

        verify(jwtUtil, never()).generateToken(any(), any());
    }

    @Test
    void login_returnsTokenOnValidCredentials() {
        User user = User.builder().id("u1").email("alice@example.com").name("Alice").passwordHash("hashed").build();
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(jwtUtil.generateToken("u1", "alice@example.com")).thenReturn("jwt-token");

        AuthResponse response = authService.login(new LoginRequest("alice@example.com", "password123"));

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.user().id()).isEqualTo("u1");
    }

    @Test
    void currentUser_returnsUserDtoWhenFound() {
        User user = User.builder().id("u1").email("alice@example.com").name("Alice").build();
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        UserDto dto = authService.currentUser("u1");

        assertThat(dto.email()).isEqualTo("alice@example.com");
    }

    @Test
    void currentUser_throwsNotFoundWhenMissing() {
        when(userRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.currentUser("missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
