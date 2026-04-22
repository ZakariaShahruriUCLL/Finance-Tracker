package com.financetracker.service;

import com.financetracker.dto.CategoryDto;
import com.financetracker.dto.CategoryRequest;
import com.financetracker.exception.ConflictException;
import com.financetracker.exception.ForbiddenException;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.model.Category;
import com.financetracker.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryDto> list(String userId) {
        return categoryRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing(Category::isDefaultCategory).reversed()
                        .thenComparing(Category::getName))
                .map(CategoryDto::from)
                .toList();
    }

    public CategoryDto create(String userId, CategoryRequest request) {
        if (categoryRepository.existsByNameAndUserId(request.name().trim(), userId)) {
            throw new ConflictException("A category with that name already exists");
        }

        Category category = Category.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .name(request.name().trim())
                .color(request.color() != null ? request.color() : "#6366f1")
                .icon(request.icon())
                .defaultCategory(false)
                .createdAt(Instant.now().toString())
                .build();

        return CategoryDto.from(categoryRepository.save(category));
    }

    public CategoryDto update(String userId, String categoryId, CategoryRequest request) {
        Category category = findOwned(userId, categoryId);

        if (category.isDefaultCategory()) {
            throw new ForbiddenException("Cannot modify predefined categories");
        }

        if (request.name() != null) category.setName(request.name().trim());
        if (request.color() != null) category.setColor(request.color());
        if (request.icon() != null) category.setIcon(request.icon());

        return CategoryDto.from(categoryRepository.save(category));
    }

    public void delete(String userId, String categoryId) {
        Category category = findOwned(userId, categoryId);

        if (category.isDefaultCategory()) {
            throw new ForbiddenException("Cannot delete predefined categories");
        }

        categoryRepository.delete(category);
    }

    private Category findOwned(String userId, String categoryId) {
        return categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }
}
