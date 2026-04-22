package com.financetracker.service;

import com.financetracker.dto.AuthResponse;
import com.financetracker.dto.LoginRequest;
import com.financetracker.dto.RegisterRequest;
import com.financetracker.dto.UserDto;
import com.financetracker.exception.ConflictException;
import com.financetracker.model.Category;
import com.financetracker.model.User;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.UserRepository;
import com.financetracker.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private record CategorySeed(String name, String color, String icon) {}

    private static final List<CategorySeed> PREDEFINED = List.of(
            new CategorySeed("Food & Dining",  "#f97316", "🍔"),
            new CategorySeed("Transport",       "#3b82f6", "🚗"),
            new CategorySeed("Housing",         "#8b5cf6", "🏠"),
            new CategorySeed("Healthcare",      "#ef4444", "💊"),
            new CategorySeed("Entertainment",   "#ec4899", "🎬"),
            new CategorySeed("Shopping",        "#f59e0b", "🛍️"),
            new CategorySeed("Education",       "#10b981", "📚"),
            new CategorySeed("Salary",          "#22c55e", "💰"),
            new CategorySeed("Investment",      "#06b6d4", "📈"),
            new CategorySeed("Other",           "#6b7280", "📦")
    );

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already in use");
        }

        String now = Instant.now().toString();
        String userId = UUID.randomUUID().toString();

        User user = User.builder()
                .id(userId)
                .email(request.email())
                .name(request.name())
                .passwordHash(passwordEncoder.encode(request.password()))
                .createdAt(now)
                .updatedAt(now)
                .build();
        user = userRepository.save(user);

        seedDefaultCategories(userId);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, UserDto.from(user));
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, UserDto.from(user));
    }

    public UserDto currentUser(String userId) {
        return userRepository.findById(userId)
                .map(UserDto::from)
                .orElseThrow(() -> new com.financetracker.exception.ResourceNotFoundException("User not found"));
    }

    private void seedDefaultCategories(String userId) {
        String now = Instant.now().toString();
        List<Category> categories = PREDEFINED.stream()
                .map(seed -> Category.builder()
                        .id(UUID.randomUUID().toString())
                        .userId(userId)
                        .name(seed.name())
                        .color(seed.color())
                        .icon(seed.icon())
                        .defaultCategory(true)
                        .createdAt(now)
                        .build())
                .toList();
        categoryRepository.saveAll(categories);
    }
}
