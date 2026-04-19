package com.financetracker.dto;

public record SummaryResponse(
        int month,
        int year,
        double income,
        double expenses,
        double balance,
        long incomeCount,
        long expenseCount
) {}
