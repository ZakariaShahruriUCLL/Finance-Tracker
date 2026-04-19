package com.financetracker.dto;

import com.financetracker.model.Transaction;

public record TransactionDto(
        String id,
        double amount,
        String type,
        String description,
        String date,
        String userId,
        String categoryId,
        CategorySummary category,
        String createdAt,
        String updatedAt
) {
    public record CategorySummary(String id, String name, String color, String icon) {}

    public static TransactionDto from(Transaction t) {
        CategorySummary catSummary = null;
        if (t.getCategory() != null) {
            catSummary = new CategorySummary(
                    t.getCategory().getId().toString(),
                    t.getCategory().getName(),
                    t.getCategory().getColor(),
                    t.getCategory().getIcon()
            );
        }

        return new TransactionDto(
                t.getId().toString(),
                t.getAmount().doubleValue(),
                t.getType().name(),
                t.getDescription(),
                t.getDate().toString(),
                t.getUser().getId().toString(),
                t.getCategory() != null ? t.getCategory().getId().toString() : null,
                catSummary,
                t.getCreatedAt().toString(),
                t.getUpdatedAt().toString()
        );
    }
}
