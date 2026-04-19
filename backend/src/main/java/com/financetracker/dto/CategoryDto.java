package com.financetracker.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.financetracker.model.Category;

public record CategoryDto(
        String id,
        String name,
        String color,
        String icon,
        @JsonProperty("isDefault") boolean defaultCategory,
        String userId,
        String createdAt
) {
    public static CategoryDto from(Category cat) {
        return new CategoryDto(
                cat.getId().toString(),
                cat.getName(),
                cat.getColor(),
                cat.getIcon(),
                cat.isDefaultCategory(),
                cat.getUser().getId().toString(),
                cat.getCreatedAt().toString()
        );
    }
}
