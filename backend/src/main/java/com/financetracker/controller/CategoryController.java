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

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<Map<String, List<CategoryDto>>> list(Authentication auth) {
        return ResponseEntity.ok(Map.of("categories", categoryService.list(auth.getName())));
    }

    @PostMapping
    public ResponseEntity<Map<String, CategoryDto>> create(
            @Valid @RequestBody CategoryRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("category", categoryService.create(auth.getName(), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, CategoryDto>> update(
            @PathVariable String id,
            @RequestBody CategoryRequest request,
            Authentication auth) {
        return ResponseEntity.ok(Map.of("category", categoryService.update(auth.getName(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        categoryService.delete(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
