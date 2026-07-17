package com.financetracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financetracker.dto.CategoryDto;
import com.financetracker.dto.CategoryRequest;
import com.financetracker.exception.ConflictException;
import com.financetracker.exception.ForbiddenException;
import com.financetracker.exception.GlobalExceptionHandler;
import com.financetracker.service.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    @Mock private CategoryService categoryService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UsernamePasswordAuthenticationToken principal =
            new UsernamePasswordAuthenticationToken("user-1", null);

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new CategoryController(categoryService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(new LocalValidatorFactoryBean())
                .setMessageConverters(new MappingJackson2HttpMessageConverter())
                .build();
    }

    @Test
    void list_returnsCategoriesForAuthenticatedUser() throws Exception {
        CategoryDto dto = new CategoryDto("c1", "Food", "#f97316", "🍔", true, "user-1", "2026-01-01T00:00:00Z");
        when(categoryService.list("user-1")).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/categories").principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories[0].name").value("Food"));
    }

    @Test
    void create_returns201OnSuccess() throws Exception {
        CategoryDto dto = new CategoryDto("c1", "Travel", "#3b82f6", null, false, "user-1", "2026-01-01T00:00:00Z");
        when(categoryService.create(eq("user-1"), any(CategoryRequest.class))).thenReturn(dto);

        mockMvc.perform(post("/api/categories").principal(principal)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new CategoryRequest("Travel", "#3b82f6", null))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category.name").value("Travel"));
    }

    @Test
    void create_returns400WhenNameMissing() throws Exception {
        mockMvc.perform(post("/api/categories").principal(principal)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new CategoryRequest("", null, null))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_returns409WhenNameAlreadyExists() throws Exception {
        when(categoryService.create(eq("user-1"), any(CategoryRequest.class)))
                .thenThrow(new ConflictException("A category with that name already exists"));

        mockMvc.perform(post("/api/categories").principal(principal)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new CategoryRequest("Food", null, null))))
                .andExpect(status().isConflict());
    }

    @Test
    void update_returns403WhenModifyingPredefinedCategory() throws Exception {
        when(categoryService.update(eq("user-1"), eq("c1"), any(CategoryRequest.class)))
                .thenThrow(new ForbiddenException("Cannot modify predefined categories"));

        mockMvc.perform(put("/api/categories/c1").principal(principal)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new CategoryRequest("New Name", null, null))))
                .andExpect(status().isForbidden());
    }

    @Test
    void delete_returns204OnSuccess() throws Exception {
        mockMvc.perform(delete("/api/categories/c1").principal(principal))
                .andExpect(status().isNoContent());
    }
}
