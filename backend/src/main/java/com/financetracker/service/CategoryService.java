package com.financetracker.service;

import com.financetracker.dto.CategoryDto;
import com.financetracker.dto.CategoryRequest;
import com.financetracker.exception.ConflictException;
import com.financetracker.exception.ForbiddenException;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.model.Category;
import com.financetracker.model.User;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<CategoryDto> list(UUID userId) {
        return categoryRepository.findByUserIdSorted(userId)
                .stream()
                .map(CategoryDto::from)
                .toList();
    }

    public CategoryDto create(UUID userId, CategoryRequest request) {
        if (categoryRepository.existsByNameAndUser_Id(request.name().trim(), userId)) {
            throw new ConflictException("A category with that name already exists");
        }

        User user = userRepository.getReferenceById(userId);
        Category category = Category.builder()
                .name(request.name().trim())
                .color(request.color() != null ? request.color() : "#6366f1")
                .icon(request.icon())
                .defaultCategory(false)
                .user(user)
                .build();

        return CategoryDto.from(categoryRepository.save(category));
    }

    public CategoryDto update(UUID userId, UUID categoryId, CategoryRequest request) {
        Category category = findOwned(userId, categoryId);

        if (category.isDefaultCategory()) {
            throw new ForbiddenException("Cannot modify predefined categories");
        }

        if (request.name() != null) category.setName(request.name().trim());
        if (request.color() != null) category.setColor(request.color());
        if (request.icon() != null) category.setIcon(request.icon());

        return CategoryDto.from(categoryRepository.save(category));
    }

    public void delete(UUID userId, UUID categoryId) {
        Category category = findOwned(userId, categoryId);

        if (category.isDefaultCategory()) {
            throw new ForbiddenException("Cannot delete predefined categories");
        }

        categoryRepository.delete(category);
    }

    private Category findOwned(UUID userId, UUID categoryId) {
        return categoryRepository.findByIdAndUser_Id(categoryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }
}
