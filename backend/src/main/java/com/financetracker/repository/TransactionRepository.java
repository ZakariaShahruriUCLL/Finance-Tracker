package com.financetracker.repository;

import com.financetracker.model.Transaction;
import com.financetracker.model.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    @Query(value = """
            SELECT t FROM Transaction t
            LEFT JOIN FETCH t.category
            WHERE t.user.id = :userId
            AND (:type IS NULL OR t.type = :type)
            AND (:categoryId IS NULL OR (t.category IS NOT NULL AND t.category.id = :categoryId))
            AND (:startDate IS NULL OR t.date >= :startDate)
            AND (:endDate IS NULL OR t.date < :endDate)
            """,
           countQuery = """
            SELECT COUNT(t) FROM Transaction t
            WHERE t.user.id = :userId
            AND (:type IS NULL OR t.type = :type)
            AND (:categoryId IS NULL OR (t.category IS NOT NULL AND t.category.id = :categoryId))
            AND (:startDate IS NULL OR t.date >= :startDate)
            AND (:endDate IS NULL OR t.date < :endDate)
            """)
    Page<Transaction> findByFilters(
            @Param("userId") UUID userId,
            @Param("type") TransactionType type,
            @Param("categoryId") UUID categoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );

    @Query("SELECT t FROM Transaction t LEFT JOIN FETCH t.category WHERE t.id = :id AND t.user.id = :userId")
    Optional<Transaction> findByIdAndUser_Id(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t
            WHERE t.user.id = :userId AND t.type = :type
            AND t.date >= :startDate AND t.date < :endDate
            """)
    BigDecimal sumAmountByUserAndTypeAndDateRange(
            @Param("userId") UUID userId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
            SELECT COUNT(t) FROM Transaction t
            WHERE t.user.id = :userId AND t.type = :type
            AND t.date >= :startDate AND t.date < :endDate
            """)
    long countByUserAndTypeAndDateRange(
            @Param("userId") UUID userId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
            SELECT t.category.id, t.category.name, t.category.color, t.category.icon, SUM(t.amount)
            FROM Transaction t
            WHERE t.user.id = :userId AND t.type = :type
            AND t.date >= :startDate AND t.date < :endDate
            AND t.category IS NOT NULL
            GROUP BY t.category.id, t.category.name, t.category.color, t.category.icon
            ORDER BY SUM(t.amount) DESC
            """)
    List<Object[]> categoryBreakdown(
            @Param("userId") UUID userId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.type = :type")
    BigDecimal sumAmountByUserAndType(@Param("userId") UUID userId, @Param("type") TransactionType type);
}
