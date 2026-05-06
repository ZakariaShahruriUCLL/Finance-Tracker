package com.financetracker.dto;

public record BudgetStatusResponse(
        int month,
        int year,
        double totalExpenses,
        double monthlyLimit,
        boolean exceeded,
        int percentage
) {}
