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
        String receiptBlobName,
        String createdAt,
        String updatedAt
) {
    public record CategorySummary(String id, String name, String color, String icon) {}

    public static TransactionDto from(Transaction t) {
        CategorySummary cat = null;
        if (t.getCategoryId() != null) {
            cat = new CategorySummary(
                    t.getCategoryId(),
                    t.getCategoryName(),
                    t.getCategoryColor(),
                    t.getCategoryIcon()
            );
        }
        return new TransactionDto(
                t.getId(),
                t.getAmount(),
                t.getType(),
                t.getDescription(),
                t.getDate(),
                t.getUserId(),
                t.getCategoryId(),
                cat,
                t.getReceiptBlobName(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
