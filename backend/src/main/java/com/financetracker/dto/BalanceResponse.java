package com.financetracker.dto;

public record BalanceResponse(
        double totalIncome,
        double totalExpenses,
        double totalBalance
) {}
