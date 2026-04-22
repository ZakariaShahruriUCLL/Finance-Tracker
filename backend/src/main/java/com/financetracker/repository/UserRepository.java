package com.financetracker.repository;

import com.azure.spring.data.cosmos.repository.CosmosRepository;
import com.financetracker.model.User;

import java.util.Optional;

public interface UserRepository extends CosmosRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
