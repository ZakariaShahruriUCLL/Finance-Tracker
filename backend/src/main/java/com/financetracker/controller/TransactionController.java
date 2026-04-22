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

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping("/balance")
    public ResponseEntity<BalanceResponse> balance(Authentication auth) {
        return ResponseEntity.ok(transactionService.allTimeBalance(auth.getName()));
    }

    @GetMapping("/category-breakdown")
    public ResponseEntity<List<CategoryBreakdownItem>> categoryBreakdown(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            Authentication auth) {
        LocalDate now = LocalDate.now();
        int m = month != null ? month : now.getMonthValue();
        int y = year != null ? year : now.getYear();
        return ResponseEntity.ok(transactionService.categoryBreakdown(auth.getName(), m, y));
    }

    @GetMapping("/summary")
    public ResponseEntity<SummaryResponse> summary(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            Authentication auth) {
        LocalDate now = LocalDate.now();
        int m = month != null ? month : now.getMonthValue();
        int y = year != null ? year : now.getYear();
        return ResponseEntity.ok(transactionService.summary(auth.getName(), m, y));
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
                transactionService.list(auth.getName(), type, categoryId, month, year, page, limit));
    }

    @PostMapping
    public ResponseEntity<Map<String, TransactionDto>> create(
            @Valid @RequestBody TransactionRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("transaction", transactionService.create(auth.getName(), request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, TransactionDto>> getOne(
            @PathVariable String id, Authentication auth) {
        return ResponseEntity.ok(Map.of("transaction", transactionService.getOne(auth.getName(), id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, TransactionDto>> update(
            @PathVariable String id,
            @RequestBody TransactionRequest request,
            Authentication auth) {
        return ResponseEntity.ok(Map.of("transaction", transactionService.update(auth.getName(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        transactionService.delete(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
