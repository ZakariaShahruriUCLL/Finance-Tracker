package com.financetracker.service;

import com.financetracker.dto.CategoryDto;
import com.financetracker.dto.CategoryRequest;
import com.financetracker.exception.ConflictException;
import com.financetracker.exception.ForbiddenException;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.model.Category;
import com.financetracker.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private static final String USER_ID = "user-1";

    private Category category(String id, String name, boolean isDefault) {
        return Category.builder()
                .id(id).userId(USER_ID).name(name).color("#6366f1").defaultCategory(isDefault)
                .createdAt("2026-01-01T00:00:00Z")
                .build();
    }

    @Test
    void list_sortsDefaultCategoriesBeforeCustomOnesThenAlphabetically() {
        Category custom = category("c1", "Zebra Custom", false);
        Category defaultB = category("c2", "Bravo", true);
        Category defaultA = category("c3", "Alpha", true);
        when(categoryRepository.findByUserId(USER_ID)).thenReturn(List.of(custom, defaultB, defaultA));

        List<CategoryDto> result = categoryService.list(USER_ID);

        assertThat(result).extracting(CategoryDto::name)
                .containsExactly("Alpha", "Bravo", "Zebra Custom");
    }

    @Test
    void create_savesTrimmedNameAndDefaultColorWhenNoneGiven() {
        CategoryRequest request = new CategoryRequest("  Groceries  ", null, "🛒");
        when(categoryRepository.existsByNameAndUserId("Groceries", USER_ID)).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        CategoryDto dto = categoryService.create(USER_ID, request);

        assertThat(dto.name()).isEqualTo("Groceries");
        assertThat(dto.color()).isEqualTo("#6366f1");
        assertThat(dto.icon()).isEqualTo("🛒");
        assertThat(dto.defaultCategory()).isFalse();
    }

    @Test
    void create_usesProvidedColorWhenGiven() {
        CategoryRequest request = new CategoryRequest("Travel", "#ff0000", null);
        when(categoryRepository.existsByNameAndUserId("Travel", USER_ID)).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        CategoryDto dto = categoryService.create(USER_ID, request);

        assertThat(dto.color()).isEqualTo("#ff0000");
    }

    @Test
    void create_throwsConflictWhenNameAlreadyExists() {
        CategoryRequest request = new CategoryRequest("Groceries", null, null);
        when(categoryRepository.existsByNameAndUserId("Groceries", USER_ID)).thenReturn(true);

        assertThatThrownBy(() -> categoryService.create(USER_ID, request))
                .isInstanceOf(ConflictException.class);

        verify(categoryRepository, never()).save(any());
    }

    @Test
    void update_throwsNotFoundWhenCategoryMissingOrNotOwnedByUser() {
        when(categoryRepository.findByIdAndUserId("missing", USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.update(USER_ID, "missing", new CategoryRequest("X", null, null)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void update_throwsForbiddenWhenCategoryIsPredefined() {
        Category predefined = category("c1", "Food", true);
        when(categoryRepository.findByIdAndUserId("c1", USER_ID)).thenReturn(Optional.of(predefined));

        assertThatThrownBy(() -> categoryService.update(USER_ID, "c1", new CategoryRequest("New Name", null, null)))
                .isInstanceOf(ForbiddenException.class);

        verify(categoryRepository, never()).save(any());
    }

    @Test
    void update_appliesOnlyNonNullFields() {
        Category existing = category("c1", "Old Name", false);
        existing.setIcon("🍕");
        when(categoryRepository.findByIdAndUserId("c1", USER_ID)).thenReturn(Optional.of(existing));
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        CategoryDto dto = categoryService.update(USER_ID, "c1", new CategoryRequest(null, "#000000", null));

        assertThat(dto.name()).isEqualTo("Old Name");
        assertThat(dto.color()).isEqualTo("#000000");
        assertThat(dto.icon()).isEqualTo("🍕");
    }

    @Test
    void delete_throwsForbiddenWhenCategoryIsPredefined() {
        Category predefined = category("c1", "Food", true);
        when(categoryRepository.findByIdAndUserId("c1", USER_ID)).thenReturn(Optional.of(predefined));

        assertThatThrownBy(() -> categoryService.delete(USER_ID, "c1"))
                .isInstanceOf(ForbiddenException.class);

        verify(categoryRepository, never()).delete(any());
    }

    @Test
    void delete_removesCustomCategory() {
        Category custom = category("c1", "Custom", false);
        when(categoryRepository.findByIdAndUserId("c1", USER_ID)).thenReturn(Optional.of(custom));

        categoryService.delete(USER_ID, "c1");

        verify(categoryRepository).delete(custom);
    }
}
