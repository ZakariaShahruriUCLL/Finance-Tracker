package com.financetracker.dto;

import com.financetracker.model.User;

public record UserDto(String id, String email, String name, String createdAt) {

    public static UserDto from(User user) {
        return new UserDto(
                user.getId().toString(),
                user.getEmail(),
                user.getName(),
                user.getCreatedAt().toString()
        );
    }
}
