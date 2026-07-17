package com.financetracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.financetracker.dto.*;
import com.financetracker.exception.GlobalExceptionHandler;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {

    @Mock private TransactionService transactionService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UsernamePasswordAuthenticationToken principal =
            new UsernamePasswordAuthenticationToken("user-1", null);

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TransactionController(transactionService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(new LocalValidatorFactoryBean())
                .setMessageConverters(new MappingJackson2HttpMessageConverter())
                .build();
    }

    @Test
    void create_returns201OnValidRequest() throws Exception {
        TransactionDto dto = new TransactionDto("t1", 50.0, "EXPENSE", "Lunch", "2026-05-01",
                "user-1", null, null, null, "2026-05-01T00:00:00Z", "2026-05-01T00:00:00Z");
        when(transactionService.create(eq("user-1"), any(TransactionRequest.class))).thenReturn(dto);

        mockMvc.perform(post("/api/transactions").principal(principal)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(
                                new TransactionRequest(50.0, "EXPENSE", "Lunch", "2026-05-01", null, null))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.transaction.id").value("t1"));
    }

    @Test
    void create_returns400WhenAmountIsNotPositive() throws Exception {
        mockMvc.perform(post("/api/transactions").principal(principal)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(
                                new TransactionRequest(0.0, "EXPENSE", "Lunch", "2026-05-01", null, null))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_returns400WhenTypeIsBlank() throws Exception {
        mockMvc.perform(post("/api/transactions").principal(principal)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(
                                new TransactionRequest(10.0, " ", "Lunch", "2026-05-01", null, null))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getOne_returns404WhenTransactionNotFound() throws Exception {
        when(transactionService.getOne("user-1", "missing"))
                .thenThrow(new ResourceNotFoundException("Transaction not found"));

        mockMvc.perform(get("/api/transactions/missing").principal(principal))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Transaction not found"));
    }

    @Test
    void delete_returns204OnSuccess() throws Exception {
        mockMvc.perform(delete("/api/transactions/t1").principal(principal))
                .andExpect(status().isNoContent());
    }

    @Test
    void list_returnsTransactionsAndPaginationMetadata() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("transactions", List.of());
        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("total", 0);
        pagination.put("page", 1);
        pagination.put("limit", 20);
        pagination.put("pages", 0);
        body.put("pagination", pagination);
        when(transactionService.list(eq("user-1"), any(), any(), any(), any(), anyInt(), anyInt())).thenReturn(body);

        mockMvc.perform(get("/api/transactions").principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pagination.total").value(0));
    }

    @Test
    void balance_returnsAllTimeBalance() throws Exception {
        when(transactionService.allTimeBalance("user-1")).thenReturn(new BalanceResponse(1000.0, 400.0, 600.0));

        mockMvc.perform(get("/api/transactions/balance").principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBalance").value(600.0));
    }

    @Test
    void budgetStatus_defaultsToCurrentMonthWhenNotSpecified() throws Exception {
        when(transactionService.budgetStatus(eq("user-1"), anyInt(), anyInt()))
                .thenReturn(new BudgetStatusResponse(5, 2026, 100.0, 500.0, false, 20));

        mockMvc.perform(get("/api/transactions/budget-status").principal(principal))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exceeded").value(false));
    }
}
