package com.financetracker.event;

public record TransactionEvent(
        String eventType,
        String userId,
        String transactionId,
        double amount,
        String type,
        String categoryName,
        String date,
        String timestamp
) {}
