package com.financetracker.service;

import com.financetracker.dto.BalanceResponse;
import com.financetracker.dto.CategoryBreakdownItem;
import com.financetracker.dto.SummaryResponse;
import com.financetracker.dto.TransactionDto;
import com.financetracker.dto.TransactionRequest;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.model.Category;
import com.financetracker.model.Transaction;
import com.financetracker.model.TransactionType;
import com.financetracker.model.User;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> list(UUID userId, String type, String categoryId,
                                    Integer month, Integer year, int page, int limit) {
        TransactionType typeEnum = null;
        if (type != null && !type.isBlank()) {
            typeEnum = TransactionType.valueOf(type.toUpperCase());
        }

        UUID catId = categoryId != null && !categoryId.isBlank() ? UUID.fromString(categoryId) : null;

        LocalDate startDate = null;
        LocalDate endDate = null;
        if (month != null && year != null) {
            startDate = LocalDate.of(year, month, 1);
            endDate = startDate.plusMonths(1);
        } else if (year != null) {
            startDate = LocalDate.of(year, 1, 1);
            endDate = startDate.plusYears(1);
        }

        int clampedLimit = Math.min(100, Math.max(1, limit));
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), clampedLimit,
                Sort.by("date").descending());

        Page<Transaction> pageResult = transactionRepository.findByFilters(
                userId, typeEnum, catId, startDate, endDate, pageable);

        List<TransactionDto> dtos = pageResult.getContent().stream()
                .map(TransactionDto::from)
                .toList();

        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("total", pageResult.getTotalElements());
        pagination.put("page", page);
        pagination.put("limit", clampedLimit);
        pagination.put("pages", pageResult.getTotalPages());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transactions", dtos);
        result.put("pagination", pagination);
        return result;
    }

    public TransactionDto create(UUID userId, TransactionRequest request) {
        TransactionType type;
        try {
            type = TransactionType.valueOf(request.type().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("type must be INCOME or EXPENSE");
        }

        Category category = resolveCategory(userId, request.categoryId());
        User user = userRepository.getReferenceById(userId);

        Transaction transaction = Transaction.builder()
                .amount(BigDecimal.valueOf(request.amount()))
                .type(type)
                .description(request.description() != null ? request.description().trim() : null)
                .date(LocalDate.parse(request.date()))
                .user(user)
                .category(category)
                .build();

        return TransactionDto.from(transactionRepository.saveAndFlush(transaction));
    }

    @Transactional(readOnly = true)
    public TransactionDto getOne(UUID userId, UUID transactionId) {
        return transactionRepository.findByIdAndUser_Id(transactionId, userId)
                .map(TransactionDto::from)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
    }

    @Transactional
    public TransactionDto update(UUID userId, UUID transactionId, TransactionRequest request) {
        Transaction transaction = transactionRepository.findByIdAndUser_Id(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        if (request.amount() > 0) {
            transaction.setAmount(BigDecimal.valueOf(request.amount()));
        }
        if (request.type() != null && !request.type().isBlank()) {
            try {
                transaction.setType(TransactionType.valueOf(request.type().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("type must be INCOME or EXPENSE");
            }
        }
        if (request.description() != null) {
            transaction.setDescription(request.description().trim().isEmpty() ? null : request.description().trim());
        }
        if (request.date() != null && !request.date().isBlank()) {
            transaction.setDate(LocalDate.parse(request.date()));
        }
        if (request.categoryId() != null) {
            transaction.setCategory(request.categoryId().isBlank()
                    ? null
                    : resolveCategory(userId, request.categoryId()));
        }

        return TransactionDto.from(transactionRepository.saveAndFlush(transaction));
    }

    @Transactional
    public void delete(UUID userId, UUID transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUser_Id(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        transactionRepository.delete(transaction);
    }

    public SummaryResponse summary(UUID userId, int month, int year) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1);

        BigDecimal income = transactionRepository
                .sumAmountByUserAndTypeAndDateRange(userId, TransactionType.INCOME, start, end);
        BigDecimal expenses = transactionRepository
                .sumAmountByUserAndTypeAndDateRange(userId, TransactionType.EXPENSE, start, end);
        long incomeCount = transactionRepository
                .countByUserAndTypeAndDateRange(userId, TransactionType.INCOME, start, end);
        long expenseCount = transactionRepository
                .countByUserAndTypeAndDateRange(userId, TransactionType.EXPENSE, start, end);

        return new SummaryResponse(
                month, year,
                income.doubleValue(),
                expenses.doubleValue(),
                income.subtract(expenses).doubleValue(),
                incomeCount,
                expenseCount
        );
    }

    @Transactional(readOnly = true)
    public List<CategoryBreakdownItem> categoryBreakdown(UUID userId, int month, int year) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1);
        return transactionRepository.categoryBreakdown(userId, TransactionType.EXPENSE, start, end)
                .stream()
                .map(row -> new CategoryBreakdownItem(
                        row[0].toString(),
                        (String) row[1],
                        (String) row[2],
                        (String) row[3],
                        ((java.math.BigDecimal) row[4]).doubleValue()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public BalanceResponse allTimeBalance(UUID userId) {
        BigDecimal income = transactionRepository.sumAmountByUserAndType(userId, TransactionType.INCOME);
        BigDecimal expenses = transactionRepository.sumAmountByUserAndType(userId, TransactionType.EXPENSE);
        return new BalanceResponse(
                income.doubleValue(),
                expenses.doubleValue(),
                income.subtract(expenses).doubleValue()
        );
    }

    private Category resolveCategory(UUID userId, String categoryId) {
        if (categoryId == null || categoryId.isBlank()) return null;
        return categoryRepository.findByIdAndUser_Id(UUID.fromString(categoryId), userId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid category"));
    }
}
