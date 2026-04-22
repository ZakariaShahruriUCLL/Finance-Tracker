package com.financetracker.service;

import com.financetracker.dto.BalanceResponse;
import com.financetracker.dto.CategoryBreakdownItem;
import com.financetracker.dto.SummaryResponse;
import com.financetracker.dto.TransactionDto;
import com.financetracker.dto.TransactionRequest;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.model.Category;
import com.financetracker.model.Transaction;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    public Map<String, Object> list(String userId, String type, String categoryId,
                                    Integer month, Integer year, int page, int limit) {
        List<Transaction> source = fetchFiltered(userId, month, year);

        Stream<Transaction> stream = source.stream();
        if (type != null && !type.isBlank()) {
            final String t = type.toUpperCase();
            stream = stream.filter(tx -> t.equals(tx.getType()));
        }
        if (categoryId != null && !categoryId.isBlank()) {
            stream = stream.filter(tx -> categoryId.equals(tx.getCategoryId()));
        }

        List<Transaction> filtered = stream
                .sorted(Comparator.comparing(Transaction::getDate).reversed()
                        .thenComparing(Transaction::getCreatedAt, Comparator.reverseOrder()))
                .toList();

        int clampedLimit = Math.min(100, Math.max(1, limit));
        int offset = Math.max(0, page - 1) * clampedLimit;
        int total = filtered.size();
        int pages = (int) Math.ceil((double) total / clampedLimit);

        List<TransactionDto> dtos = filtered.stream().skip(offset).limit(clampedLimit)
                .map(TransactionDto::from).toList();

        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("total", total);
        pagination.put("page", page);
        pagination.put("limit", clampedLimit);
        pagination.put("pages", pages);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transactions", dtos);
        result.put("pagination", pagination);
        return result;
    }

    public TransactionDto create(String userId, TransactionRequest request) {
        validateType(request.type());

        Category category = resolveCategory(userId, request.categoryId());
        String now = Instant.now().toString();

        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .amount(request.amount())
                .type(request.type().toUpperCase())
                .description(request.description() != null ? request.description().trim() : null)
                .date(request.date())
                .categoryId(category != null ? category.getId() : null)
                .categoryName(category != null ? category.getName() : null)
                .categoryColor(category != null ? category.getColor() : null)
                .categoryIcon(category != null ? category.getIcon() : null)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return TransactionDto.from(transactionRepository.save(transaction));
    }

    public TransactionDto getOne(String userId, String transactionId) {
        return transactionRepository.findByIdAndUserId(transactionId, userId)
                .map(TransactionDto::from)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
    }

    public TransactionDto update(String userId, String transactionId, TransactionRequest request) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        if (request.amount() > 0) transaction.setAmount(request.amount());
        if (request.type() != null && !request.type().isBlank()) {
            validateType(request.type());
            transaction.setType(request.type().toUpperCase());
        }
        if (request.description() != null) {
            transaction.setDescription(request.description().trim().isEmpty() ? null : request.description().trim());
        }
        if (request.date() != null && !request.date().isBlank()) {
            transaction.setDate(request.date());
        }
        if (request.categoryId() != null) {
            Category category = resolveCategory(userId, request.categoryId());
            transaction.setCategoryId(category != null ? category.getId() : null);
            transaction.setCategoryName(category != null ? category.getName() : null);
            transaction.setCategoryColor(category != null ? category.getColor() : null);
            transaction.setCategoryIcon(category != null ? category.getIcon() : null);
        }
        transaction.setUpdatedAt(Instant.now().toString());

        return TransactionDto.from(transactionRepository.save(transaction));
    }

    public void delete(String userId, String transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        transactionRepository.delete(transaction);
    }

    public SummaryResponse summary(String userId, int month, int year) {
        List<Transaction> txs = fetchForMonth(userId, month, year);

        double income = txs.stream().filter(t -> "INCOME".equals(t.getType())).mapToDouble(Transaction::getAmount).sum();
        double expenses = txs.stream().filter(t -> "EXPENSE".equals(t.getType())).mapToDouble(Transaction::getAmount).sum();
        long incomeCount = txs.stream().filter(t -> "INCOME".equals(t.getType())).count();
        long expenseCount = txs.stream().filter(t -> "EXPENSE".equals(t.getType())).count();

        return new SummaryResponse(month, year, income, expenses, income - expenses, incomeCount, expenseCount);
    }

    public BalanceResponse allTimeBalance(String userId) {
        List<Transaction> all = transactionRepository.findByUserId(userId);
        double income = all.stream().filter(t -> "INCOME".equals(t.getType())).mapToDouble(Transaction::getAmount).sum();
        double expenses = all.stream().filter(t -> "EXPENSE".equals(t.getType())).mapToDouble(Transaction::getAmount).sum();
        return new BalanceResponse(income, expenses, income - expenses);
    }

    public List<CategoryBreakdownItem> categoryBreakdown(String userId, int month, int year) {
        List<Transaction> txs = fetchForMonth(userId, month, year);

        Map<String, CategoryBreakdownItem> map = new LinkedHashMap<>();
        for (Transaction t : txs) {
            if (!"EXPENSE".equals(t.getType()) || t.getCategoryId() == null) continue;
            map.merge(
                    t.getCategoryId(),
                    new CategoryBreakdownItem(t.getCategoryId(), t.getCategoryName(), t.getCategoryColor(), t.getCategoryIcon(), t.getAmount()),
                    (a, b) -> new CategoryBreakdownItem(a.categoryId(), a.name(), a.color(), a.icon(), a.amount() + b.amount())
            );
        }

        return map.values().stream()
                .sorted(Comparator.comparingDouble(CategoryBreakdownItem::amount).reversed())
                .toList();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private List<Transaction> fetchFiltered(String userId, Integer month, Integer year) {
        if (month != null && year != null) {
            return fetchForMonth(userId, month, year);
        } else if (year != null) {
            String start = LocalDate.of(year, 1, 1).toString();
            String end = LocalDate.of(year + 1, 1, 1).toString();
            return transactionRepository.findByUserIdAndDateRange(userId, start, end);
        }
        return transactionRepository.findByUserId(userId);
    }

    private List<Transaction> fetchForMonth(String userId, int month, int year) {
        LocalDate start = LocalDate.of(year, month, 1);
        return transactionRepository.findByUserIdAndDateRange(userId, start.toString(), start.plusMonths(1).toString());
    }

    private void validateType(String type) {
        if (!"INCOME".equalsIgnoreCase(type) && !"EXPENSE".equalsIgnoreCase(type)) {
            throw new IllegalArgumentException("type must be INCOME or EXPENSE");
        }
    }

    private Category resolveCategory(String userId, String categoryId) {
        if (categoryId == null || categoryId.isBlank()) return null;
        return categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid category"));
    }
}
