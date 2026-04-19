package com.financetracker.dto;

public record CategoryBreakdownItem(
        String categoryId,
        String name,
        String color,
        String icon,
        double amount
) {}
