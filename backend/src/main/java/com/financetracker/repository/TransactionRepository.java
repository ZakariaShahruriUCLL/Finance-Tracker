package com.financetracker.repository;

import com.azure.spring.data.cosmos.repository.CosmosRepository;
import com.financetracker.model.Transaction;
import com.azure.spring.data.cosmos.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends CosmosRepository<Transaction, String> {

    List<Transaction> findByUserId(String userId);

    @Query("SELECT * FROM c WHERE c.userId = @userId AND c.date >= @startDate AND c.date < @endDate")
    List<Transaction> findByUserIdAndDateRange(String userId, String startDate, String endDate);

    Optional<Transaction> findByIdAndUserId(String id, String userId);
}
