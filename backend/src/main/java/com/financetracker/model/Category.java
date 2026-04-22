package com.financetracker.model;

import com.azure.spring.data.cosmos.core.mapping.Container;
import com.azure.spring.data.cosmos.core.mapping.PartitionKey;
import lombok.*;
import org.springframework.data.annotation.Id;

@Container(containerName = "categories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Category {

    @Id
    private String id;

    @PartitionKey
    private String userId;

    private String name;

    @Builder.Default
    private String color = "#6366f1";

    private String icon;

    @Builder.Default
    private boolean defaultCategory = false;

    private String createdAt;
}
