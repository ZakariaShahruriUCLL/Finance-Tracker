package com.financetracker.controller;

import com.financetracker.dto.CategoryDto;
import com.financetracker.dto.CategoryRequest;
import com.financetracker.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<Map<String, List<CategoryDto>>> list(Authentication auth) {
        List<CategoryDto> categories = categoryService.list(userId(auth));
        return ResponseEntity.ok(Map.of("categories", categories));
    }

    @PostMapping
    public ResponseEntity<Map<String, CategoryDto>> create(
            @Valid @RequestBody CategoryRequest request, Authentication auth) {
        CategoryDto category = categoryService.create(userId(auth), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("category", category));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, CategoryDto>> update(
            @PathVariable UUID id,
            @RequestBody CategoryRequest request,
            Authentication auth) {
        CategoryDto category = categoryService.update(userId(auth), id, request);
        return ResponseEntity.ok(Map.of("category", category));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication auth) {
        categoryService.delete(userId(auth), id);
        return ResponseEntity.noContent().build();
    }

    private UUID userId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
