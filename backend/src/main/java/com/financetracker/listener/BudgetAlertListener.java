package com.financetracker.listener;

import com.azure.messaging.servicebus.ServiceBusClientBuilder;
import com.azure.messaging.servicebus.ServiceBusProcessorClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financetracker.event.TransactionEvent;
import com.financetracker.model.Transaction;
import com.financetracker.repository.TransactionRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
public class BudgetAlertListener {

    private final String connectionString;
    private final ObjectMapper objectMapper;
    private final TransactionRepository transactionRepository;
    private final double monthlyLimit;
    private ServiceBusProcessorClient processor;

    public BudgetAlertListener(
            @Value("${SERVICE_BUS_CONNECTION_STRING}") String connectionString,
            @Value("${budget.monthly-limit:500.0}") double monthlyLimit,
            ObjectMapper objectMapper,
            TransactionRepository transactionRepository) {
        this.connectionString = connectionString;
        this.monthlyLimit = monthlyLimit;
        this.objectMapper = objectMapper;
        this.transactionRepository = transactionRepository;
    }

    @PostConstruct
    public void start() {
        processor = new ServiceBusClientBuilder()
                .connectionString(connectionString)
                .processor()
                .topicName("transaction-events")
                .subscriptionName("budget-alert")
                .processMessage(ctx -> {
                    try {
                        TransactionEvent event = objectMapper.readValue(
                                ctx.getMessage().getBody().toString(), TransactionEvent.class);

                        if ("transaction.deleted".equals(event.eventType())
                                || !"EXPENSE".equals(event.type())) return;

                        LocalDate date = LocalDate.parse(event.date());
                        String start = date.withDayOfMonth(1).toString();
                        String end = date.withDayOfMonth(1).plusMonths(1).toString();

                        List<Transaction> monthly = transactionRepository
                                .findByUserIdAndDateRange(event.userId(), start, end);
                        double totalExpenses = monthly.stream()
                                .filter(t -> "EXPENSE".equals(t.getType()))
                                .mapToDouble(Transaction::getAmount)
                                .sum();

                        if (totalExpenses > monthlyLimit) {
                            log.warn("[BUDGET] user:{} exceeded monthly limit: €{} / €{}",
                                    event.userId(),
                                    String.format("%.2f", totalExpenses),
                                    String.format("%.2f", monthlyLimit));
                        }
                    } catch (Exception e) {
                        log.error("[BUDGET] Failed to process message: {}", e.getMessage());
                        throw new RuntimeException(e);
                    }
                })
                .processError(ctx -> log.error("[BUDGET] Service Bus error: {}",
                        ctx.getException().getMessage()))
                .buildProcessorClient();
        processor.start();
        log.info("BudgetAlertListener started");
    }

    @PreDestroy
    public void stop() {
        if (processor != null) processor.close();
    }
}
