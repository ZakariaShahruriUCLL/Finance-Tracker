package com.financetracker.model;

import com.azure.spring.data.cosmos.core.mapping.Container;
import com.azure.spring.data.cosmos.core.mapping.PartitionKey;
import lombok.*;
import org.springframework.data.annotation.Id;

@Container(containerName = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @PartitionKey
    private String id;

    private String email;
    private String passwordHash;
    private String name;
    private String createdAt;
    private String updatedAt;
}
