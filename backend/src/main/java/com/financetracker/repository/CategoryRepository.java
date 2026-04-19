package com.financetracker.repository;

import com.financetracker.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId ORDER BY c.defaultCategory DESC, c.name ASC")
    List<Category> findByUserIdSorted(@Param("userId") UUID userId);

    Optional<Category> findByIdAndUser_Id(UUID id, UUID userId);

    boolean existsByNameAndUser_Id(String name, UUID userId);
}
