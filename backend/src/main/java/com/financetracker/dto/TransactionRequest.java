package com.financetracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record TransactionRequest(
        @Positive(message = "Amount must be greater than 0") double amount,
        @NotBlank(message = "Type is required (INCOME or EXPENSE)") String type,
        String description,
        @NotBlank(message = "Date is required") String date,
        String categoryId
) {}
