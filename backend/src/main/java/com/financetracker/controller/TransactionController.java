package com.financetracker.controller;

import com.financetracker.dto.BalanceResponse;
import com.financetracker.dto.CategoryBreakdownItem;
import com.financetracker.dto.SummaryResponse;
import com.financetracker.dto.TransactionDto;
import com.financetracker.dto.TransactionRequest;
import com.financetracker.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    // Must be declared before /{id} so Spring MVC matches "summary" literally
    @GetMapping("/summary")
    public ResponseEntity<SummaryResponse> summary(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            Authentication auth) {

        LocalDate now = LocalDate.now();
        int m = month != null ? month : now.getMonthValue();
        int y = year != null ? year : now.getYear();

        return ResponseEntity.ok(transactionService.summary(userId(auth), m, y));
    }

    @GetMapping("/balance")
    public ResponseEntity<BalanceResponse> balance(Authentication auth) {
        return ResponseEntity.ok(transactionService.allTimeBalance(userId(auth)));
    }

    @GetMapping("/category-breakdown")
    public ResponseEntity<List<CategoryBreakdownItem>> categoryBreakdown(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            Authentication auth) {
        LocalDate now = LocalDate.now();
        int m = month != null ? month : now.getMonthValue();
        int y = year != null ? year : now.getYear();
        return ResponseEntity.ok(transactionService.categoryBreakdown(userId(auth), m, y));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            Authentication auth) {

        return ResponseEntity.ok(
                transactionService.list(userId(auth), type, categoryId, month, year, page, limit));
    }

    @PostMapping
    public ResponseEntity<Map<String, TransactionDto>> create(
            @Valid @RequestBody TransactionRequest request, Authentication auth) {
        TransactionDto transaction = transactionService.create(userId(auth), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("transaction", transaction));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, TransactionDto>> getOne(
            @PathVariable UUID id, Authentication auth) {
        TransactionDto transaction = transactionService.getOne(userId(auth), id);
        return ResponseEntity.ok(Map.of("transaction", transaction));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, TransactionDto>> update(
            @PathVariable UUID id,
            @RequestBody TransactionRequest request,
            Authentication auth) {
        TransactionDto transaction = transactionService.update(userId(auth), id, request);
        return ResponseEntity.ok(Map.of("transaction", transaction));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication auth) {
        transactionService.delete(userId(auth), id);
        return ResponseEntity.noContent().build();
    }

    private UUID userId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
