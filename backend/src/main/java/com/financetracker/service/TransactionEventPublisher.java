package com.financetracker.service;

import com.azure.messaging.servicebus.ServiceBusMessage;
import com.azure.messaging.servicebus.ServiceBusSenderClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.financetracker.event.TransactionEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionEventPublisher {

    private final ServiceBusSenderClient transactionEventSender;
    private final ObjectMapper objectMapper;

    public void publish(String eventType, String userId, String transactionId,
                        double amount, String type, String categoryName, String date) {
        try {
            TransactionEvent event = new TransactionEvent(
                    eventType, userId, transactionId, amount, type, categoryName, date,
                    Instant.now().toString());
            String body = objectMapper.writeValueAsString(event);
            transactionEventSender.sendMessage(new ServiceBusMessage(body));
            log.info("Published {} for transaction {}", eventType, transactionId);
        } catch (Exception e) {
            log.error("Failed to publish {}: {}", eventType, e.getMessage());
        }
    }
}
