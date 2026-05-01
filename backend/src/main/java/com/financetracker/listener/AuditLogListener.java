package com.financetracker.listener;

import com.azure.messaging.servicebus.ServiceBusClientBuilder;
import com.azure.messaging.servicebus.ServiceBusProcessorClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financetracker.event.TransactionEvent;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuditLogListener {

    private final String connectionString;
    private final ObjectMapper objectMapper;
    private ServiceBusProcessorClient processor;

    public AuditLogListener(
            @Value("${SERVICE_BUS_CONNECTION_STRING}") String connectionString,
            ObjectMapper objectMapper) {
        this.connectionString = connectionString;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void start() {
        processor = new ServiceBusClientBuilder()
                .connectionString(connectionString)
                .processor()
                .topicName("transaction-events")
                .subscriptionName("audit-log")
                .processMessage(ctx -> {
                    try {
                        TransactionEvent event = objectMapper.readValue(
                                ctx.getMessage().getBody().toString(), TransactionEvent.class);
                        log.info("[AUDIT] user:{} {} {} €{} in {} on {}",
                                event.userId(), event.eventType(), event.type(),
                                String.format("%.2f", event.amount()),
                                event.categoryName() != null ? event.categoryName() : "uncategorised",
                                event.date());
                    } catch (Exception e) {
                        log.error("[AUDIT] Failed to process message: {}", e.getMessage());
                        throw new RuntimeException(e);
                    }
                })
                .processError(ctx -> log.error("[AUDIT] Service Bus error: {}",
                        ctx.getException().getMessage()))
                .buildProcessorClient();
        processor.start();
        log.info("AuditLogListener started");
    }

    @PreDestroy
    public void stop() {
        if (processor != null) processor.close();
    }
}
