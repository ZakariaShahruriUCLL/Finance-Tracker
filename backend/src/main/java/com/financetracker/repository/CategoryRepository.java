package com.financetracker.repository;

import com.azure.spring.data.cosmos.repository.CosmosRepository;
import com.financetracker.model.Category;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends CosmosRepository<Category, String> {

    List<Category> findByUserId(String userId);

    Optional<Category> findByIdAndUserId(String id, String userId);

    boolean existsByNameAndUserId(String name, String userId);
}
