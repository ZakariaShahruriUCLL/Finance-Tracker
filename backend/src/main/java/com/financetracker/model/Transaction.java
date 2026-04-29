package com.financetracker.model;

import com.azure.spring.data.cosmos.core.mapping.Container;
import com.azure.spring.data.cosmos.core.mapping.PartitionKey;
import lombok.*;
import org.springframework.data.annotation.Id;

@Container(containerName = "transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transaction {

    @Id
    private String id;

    @PartitionKey
    private String userId;

    private double amount;
    private String type;        // "INCOME" or "EXPENSE"
    private String description;
    private String date;        // ISO date: "2026-04-20"

    // Category fields embedded to avoid cross-container joins
    private String categoryId;
    private String categoryName;
    private String categoryColor;
    private String categoryIcon;

    private String receiptBlobName;

    private String createdAt;
    private String updatedAt;
}
